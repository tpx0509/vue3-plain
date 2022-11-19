import { isFunction } from "@vue/shared";
import { ReactiveEffect, trackEffect, triggerEffect } from "./effect";

class ComputedRefImpl {
    public deps = new Set()
    public _dirty = true // 默认取值时计算
    public __v_isRef = true
    public __v_isReadonly = true
    public _value // = ?
    public effect
    constructor(public getter, public setter) {
        // 将用户的getter放到effect中，里面的取值会被这个effect收集起来
         this.effect = new ReactiveEffect(getter,() => {
             // 这里就是effect的调度器，稍后依赖的属性变化了会触发此函数
            //  console.log('数据变化了scheduler')
             if(!this._dirty) {
                this._dirty = true
                // 触发computed依赖的effect更新
                triggerEffect(this.deps)
             }
         })
    }
    // 类中的属性访问器，原理是Object.defineProperty()
    get value() {
        // 依赖收集，取值的时候收集外层的effect(当前computed再哪个effect中使用)
        trackEffect(this.deps,'computed')
        if(this._dirty) { // 这个值脏的，应该重新取值了
            this._dirty = false
            // 取值的时候run当前computed所绑定的effect。等会computed依赖的属性变了，会触发effect的调度器
            this._value = this.effect.run()
        }
        return this._value
        
    }
    set value(value) {
        this.setter(value)
    }

}

export function computed(getterOrOptions) {
    let onlyGetter = isFunction(getterOrOptions)
    let getter;
    let setter;
    if(onlyGetter) {
        getter = getterOrOptions
        setter = () => {
             console.warn('Write operation failed: computed value is readonly')
        }
    }else {
        getter = getterOrOptions.get
        setter = getterOrOptions.set
    }
    return new ComputedRefImpl(getter,setter)
}