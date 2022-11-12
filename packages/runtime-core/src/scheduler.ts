let queue = []
let isFlushing = false
let resolvePromise = Promise.resolve()
export function queueJob(job) {
    if(!queue.includes(job)) {
        queue.push(job)
    }
    if(!isFlushing) { // 批处理逻辑
        isFlushing = true
        let execQueue = queue.slice(0)
        
        resolvePromise.then(() => {
            queue.length = 0 // 要在执行之前清空队列，因为在执行job的过程中可能也会新增job，
            // 如果放在之后，可能会把在执行时添加的任务清空
            isFlushing = false  // 状态重置也要放在执行之前。原因同上。放在执行之后遇到了跳过更新的bug（componentUpdate.html的案例就可以复现，放在执行之后第一次点击时视图不会更新）
            execQueue.forEach(job => job())
            execQueue.length = 0
            
        })
    }
}


