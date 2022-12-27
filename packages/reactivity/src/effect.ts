import { recordEffectScope } from ".";

export let activeEffect = null;

export class ReactiveEffect {
    public active = true
    public parent = null
    public deps = []
    constructor(public fn,public scheduler?) {
        recordEffectScope(this) // effectScope使用
    }
    run() { 
        // 执行过程中会触发getter，setter。 需要收集依赖，
        // 这里将当前effect保存为activeEffect，
        // getter中会进行依赖收集
        try {
            // 不是激活状态的， 直接执行
           if(!this.active) { return this.fn()}  
            // 这里就应该进行依赖收集了，核心就是将当前的effect和稍后渲染的属性关联在一起
            
           // 先保存一下当前effect的父effect， 
           // parent是为了解决嵌套effect的问题
           // （内部的effect执行完了直接将activeEffect置为null，会导致父effect后续的取值无法收集依赖）
           this.parent = activeEffect 
           activeEffect = this
           // 每次执行之前，都应该先将之前收集的effect都清空，重新收集。
           // 这一步是为了解决 分支切换
           cleanupEffect(this)
           return this.fn()
        } finally {
           activeEffect = this.parent
           this.parent = null;
        }
        
    }
    stop() {
        if(this.active) {
            this.active = false
            cleanupEffect(this)   
        }
    }
}

const targetDeps = new WeakMap(); 
// 将来收集存储的格式 { 对象：{ 对象的属性 : Set[effect,effect,...] } } 
export function track(target,key,type) {
    //  console.log('收集依赖',key,activeEffect)
     // 不是在effect执行时触发的，什么都不做
     if(!activeEffect) return;
     // 依赖收集
     // 看当前取值的对象有没有被收集过
     let depMaps = targetDeps.get(target)
     if(!depMaps) {
        targetDeps.set(target, depMaps = new Map())
     }
     // 看当前取值对象的取值属性有没有被收集过
     let deps = depMaps.get(key)
     if(!deps) {
        depMaps.set(key,deps = new Set([]))
     }
     trackEffect(deps)
    //  console.log('依赖收集map',targetDeps)
}

export function trackEffect(deps,type?:string) {
    if(type === 'computed' ) {
        // console.log('computed取值的时候收集依赖',activeEffect,deps)
    }
    if(activeEffect) {
        let shouldTract = !deps.has(activeEffect)
        if(shouldTract) {
           deps.add(activeEffect)
           // 反向记忆，属性存储了依赖的effect，让effect也存储他依赖的属性的set
           // deps就是一个与当前副作用函数存在联系的依赖集合
           // 将其添加到activeEffect.deps数组中
           activeEffect.deps.push(deps)
        }
    }
}

export function trigger(target,key,value,oldValue,type) {
    let targetDep = targetDeps.get(target)
    // console.log('track',key,value,oldValue)
    if(targetDep) {
        
        let effects = targetDep.get(key) // 找到了属性对应的effect
        triggerEffect(effects)
    }
}
export function triggerEffect(effects) {
    // 执行的时候先拷贝一份再执行。不要关联引用
    // 既push(在依赖收集的时候)又delete(在触发依赖的时候，run中会先清理一遍effect)会死循环
    // 类似： let s = new Set([1]); s.forEach(() => { s.delete(1); s.add(1); console.log('死循环')})
    if(effects) {
        effects = new Set(effects);
        effects.forEach(effect => {
            // 在执行effect的时候，又要执行自己（在effect内部进行赋值操作），需要屏蔽掉，不要无限调用
            if(activeEffect !== effect) {
                if(effect.scheduler) {
                    // 如果用户传了调度器函数，执行用户的
                    effect.scheduler()
                }else {
                    // 否则执行自己的
                    effect.run() 
                }
                
            }
        });  
    }
    
}
// 每次副作用函数执行时，我们可以先把它从所有与之关联的依赖集合中删除
// 后续当副作用函数执行完毕后，会重新建立联系
function cleanupEffect(effect) {
    // deps是依赖集合 [set([effect,effect]),set([effect,effect])]
    let { deps } = effect
    for(let i=0; i< deps.length; i++) {
        // 将effect从依赖集合中删除 （删除引用）
         deps[i].delete(effect) // 解除effect，重新依赖收集
    }
    // 重置数组 （当前effect的deps）
    effect.deps.length = 0
}

type Options = {
    scheduler : () => void
}

export function effect(fn,options={} as Options) {
    // 这里fn可以根据状态变化重新执行， effect可以嵌套着写
    const _effect = new ReactiveEffect(fn,options.scheduler)
    // 默认先执行一次
    _effect.run()

    const runner = _effect.run.bind(_effect) // 用户可以自己执行的函数。
    runner.effect = _effect
    return runner
}


// 核心步骤

/*
    1) 先搞一个响应式对象 new Proxy
    2) effect默认数据变化要能更新，我们先将正在执行的effect作为全局变量。在get方法中进行依赖收集，渲染（取值）。
    3) weakMap { 对象 ： { 属性 ： set([effect])} }
    4) 稍后用户发生数据变化，会通过对象属性来查找对应的effect集合，找到effect全部执行
*/
