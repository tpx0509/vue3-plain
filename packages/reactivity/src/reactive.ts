import { isObject } from "@vue/shared";
import { mutableHandlers,ReactiveFlags } from './baseHandler';


export function isReactive(value) {
     return !!(value && value[ReactiveFlags.IS_REACTIVE])
}

let reactiveMap = new WeakMap();

// 将数据转化成响应式的数据，只能做对象的代理
export function reactive(target) {
    if(!isObject(target)) {
        return
    }
    // 1)同一个对象，代理多次，返回同一个代理
    let exisitingProxy = reactiveMap.get(target)
    if(exisitingProxy) {
        return exisitingProxy;
    }
    // 2)代理对象被再次代理，直接返回
    if(target[ReactiveFlags.IS_REACTIVE]) {
        return target
    }
    // 并没有重新定义属性，只是对对象做了一层代理，在取值的时候会调用get，
    // 当赋值的时候会调用set
    let proxy = new Proxy(target,mutableHandlers)
    reactiveMap.set(target,proxy) // 代理过的对象关联起来并存起来
    return proxy
}

