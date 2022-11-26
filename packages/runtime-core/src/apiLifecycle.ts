import { currentInstance, setCurrentInstance } from "./component"

export const enum LifecycleHooks {
    ONBEFOREMOUNT = 'bm',
    ONMOUNTED = 'm',
    ONBEFOREUPDATE = 'bu',
    ONUPDATED = 'u'
}

// 工厂模式
const createHook = (type) => {
    return (hook, target = currentInstance) => { // hook 需要绑定到对应的实例上
        if (target) { // 关联此currentInstance和hook
            const hooks = target[type] || (target[type] = [])
            // 函数切片 实现在生命周期函数中也可以取到currentInstance
            const wrappedHook = () => {
                setCurrentInstance(target)
                hook()
                setCurrentInstance(null)
            }
            hooks.push(wrappedHook)
        }
    }
}
export const onBeforeMount = createHook(LifecycleHooks.ONBEFOREMOUNT)
export const onMounted = createHook(LifecycleHooks.ONMOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.ONBEFOREUPDATE)
export const onUpdated = createHook(LifecycleHooks.ONUPDATED)