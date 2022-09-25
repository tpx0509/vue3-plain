import { isFunction,isObject } from '@vue/shared';
import { ReactiveEffect } from "./effect";
import { isReactive } from './reactive';

function traversal(value,set = new Set()) {
     // 递归要有终结条件
     if(!isObject(value)) return value;
     // 避免循环引用
     if(set.has(value)) {
         return value
     }
     set.add(value)
     for(let key in value) {
        traversal(value[key],set)
     }
     return value;
}

export function watch(source,cb) {
    let getter;
    if(isReactive(source)) {
        // 如果传递的是响应式数据，需要递归遍历一遍这个数据，挨个儿取值。
        // 取值的时候，_effect会进行依赖收集，
        // 这样后续数据的任何一个属性变化了,都可以监控到。只要一变化就会执行job
        console.log('响应式数据',source)
        getter = () => traversal(source)
    }else if(isFunction(source)) {
        getter = source
    }
    // 回调函数包装一次，因为要保存新值和老值
    let oldValue;
    let clean;
    let onCleanup = (fn) => {
         clean = fn // 保存用户传入的函数，下次watch触发时执行
    }
    const job = () => {
        clean && clean()
        // 执行回调的时候,_effect.run拿到的就是新值了
        let newValue = _effect.run()
        cb(newValue,oldValue,onCleanup)
        oldValue = newValue
    }
    let _effect = new ReactiveEffect(getter,job)
    // _effect.run的执行结果就是getter的执行结果，也就是用户传递的函数的执行结果
    // 默认执行一次 拿到老值
    oldValue = _effect.run()
}

// watch也是基于effect,监控的数据变化了，执行回调