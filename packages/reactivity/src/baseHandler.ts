import { isReactive, reactive } from './reactive';
import { isObject } from './../../shared/src/index';
import { track,trigger } from "./effect"
export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
    RAW = '__v_raw'
}
export const mutableHandlers = {
    get(target,key,receiver) {    
        // 给代理对象添加一个标识
        if(key === ReactiveFlags.IS_REACTIVE) {
            return true
        }
        if(key === ReactiveFlags.RAW) {
            return target
        }
        // console.log('get',target,key)
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
        let oldValue = target[key]

        // fix: 数据污染问题
        // 如果 value 是响应式数据，就意味着设置到原始对象上的也是响应式数据，我们把响应式数据设置到原始数据上的行为称为数据污染。
        // 只要发现即将要设置的值是响应式数据，那么就通过 raw 属性获取原始数据，再把原始数据设置到 target 上
        let setValue = isReactive(value) ? value[ReactiveFlags.RAW] : value

        let result = Reflect.set(target,key,setValue,receiver)

        // console.log(target,receiver,receiver[ReactiveFlags.RAW])
        
        if(receiver[ReactiveFlags.RAW] === target) {// 屏蔽由原型引起的更新
            // console.log('oldValue,value',oldValue,value)
            if(oldValue !== value && (oldValue === oldValue || value === value)) {
                // 触发effect
                trigger(target,key,value,oldValue,'set')
            }   
        }
        return result
    }
}

// 例1
// let target = {
//     name : 'tianpeixin',
//     get alias() {
//         // 使用Reflect.get访问时这里的this会改为proxy代理对象
//         return this.name
//     }
// }

// let proxy1 = new Proxy(target,{
//     get(target,key,receiver) {
//         let res = Reflect.get(target,key,receiver)
//         console.log(res)
//         return res
//     }
// })

// proxy1.name
// proxy1.alias