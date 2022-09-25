import { reactive } from './reactive';
import { isObject } from './../../shared/src/index';
import { track,trigger } from "./effect"
export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive'
}
export const mutableHandlers = {
    get(target,key,receiver) {
        // 给代理对象添加一个标识
        if(key === ReactiveFlags.IS_REACTIVE) {
            return true
        }
        console.log('get',target,key)
        // 依赖收集
        track(target,key,'get')
        // Reflect和proxy配对使用 。不能使用 target[key]
        // 因为Reflect.get可以将属性访问的this改成receiver也就是proxy代理对象
        // 遇到像属性访问器这种（例1），可以正确代理到访问的值
        let result = Reflect.get(target,key,receiver)
        if(isObject(result)) {
            // 深度代理实现，取值的时候才进行代理，性能好
            return reactive(result)
        }
        return result
    },
    set(target,key,value,receiver) {
        console.log('set',target,key)
        let oldValue = target[key]
        let result = Reflect.set(target,key,value,receiver)
        if(oldValue !== value) {
            // 触发effect
            trigger(target,key,value,oldValue,'set')
        }

        return result
    }
}

// 例1
// let target = {
//     name : 'tianpeixin',
//     get alias() {
//         // 使用Reflect.get访问时这里的this会改为proxy代理对象
//         return this.alias
//     }
// }