// 先移除事件，再重新绑定事件的优化，
// 其实绑定的都是一个函数，内部调用我们绑定在元素上的value属性。
// 后续要重新绑定其他事件了，直接修改value属性
// 这样就不需要每次先卸载事件了，直接事件绑定函数内部调用的函数
function createInvoker(callback) {
    const invoker =  (e) => invoker.value()
         invoker.value =  callback
     return invoker
}

export function patchEvent(el,eventName,nextValue) {
     let invokers = el._vei || (el._vei = {})

     let exits = invokers[eventName]
     if(exits) {
        // 已经绑定过事件了
        if(nextValue) {
            exits.value = nextValue // 没有卸载函数，只是改了invoker的value属性
        }else {
            // 有老值,但是新值为空，需要将老的绑定事件移除掉
            el.removeEventListener(event,exits)
            invokers[eventName] = undefined
        }
     }else {
        // 第一次绑定
        let event = eventName.slice(2).toLowerCase()
        if(nextValue) {
            const invoker = invokers[eventName] = createInvoker(nextValue)
            el.addEventListener(event,invoker)
        }
     }
     
}