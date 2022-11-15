import { isArray, isObject } from "@vue/shared"
import { trackEffect, triggerEffect } from "./effect";
import { isReactive, reactive } from "./reactive";

function toReactive(value) {
    return isObject(value) ? reactive(value) : value;
}

class RefImpl {
    public deps=new Set()
    public _value
    public __v_isRef = true
    constructor(public _rawValue) {
        this._value = toReactive(_rawValue)
    }
    // ref和computed都是利用value做了一层劫持 用来收集effect
    get value() {
        trackEffect(this.deps)
        return this._value
    }
    set value(newValue) {
        if(newValue !== this._rawValue) {
            this._value = toReactive(newValue)
            triggerEffect(this.deps)
            this._rawValue = newValue
        }
    }
}

export function ref(value) {
    return new RefImpl(value)     
}

class ObjectRefImpl { // 只是将.value属性代理到原始对象上
    public __v_isRef= true
    constructor(public _object, public _key) {
        
    }
    // 又是一层劫持
    // toRef的原理就是如果你取我给你返回的对象上某个属性的value属性，
    // 我就给你返回源对象上对应的值
    get value() {
        return this._object[this._key]
    }
    set value(newValue) {
        this._object[this._key] = newValue
    }
}

export function toRef(object,key) {
     return new ObjectRefImpl(object,key)
}

// 将reactive对象每一项变成ref
export function toRefs(object) {
    if(!isReactive(object)) {
        console.error('请传入reactive对象')
        return object
    }
    let result = isArray(object)? new Array(object.length) : {}
    for(let key in object) {
        result[key] = toRef(object,key)
    }
    return result
}

function isRef(value) {
    return !!(value && value['__v_isRef'])
}

export function proxyRefs(object) {
     return new Proxy(object,{
         get(target,key,receiver) {
            let result = Reflect.get(target,key,receiver)
            return isRef(result)?result.value : result; // 如果取值的结果是ref值，就帮用户.value一下
         },
         set(target,key,value,receiver) {
             let oldValue = target[key]
             if(isRef(oldValue)) {
                // 老师是这样写的。不知道为什么这里不用Reflect.set
                oldValue.value = value
                return true
                // 我觉得可以这样  // 可能是receiver不能是oldValue
                // return Reflect.set(oldValue,'value',value,oldValue)
             }else {
                return Reflect.set(target,key,value,receiver)
             }
         }
     })
}