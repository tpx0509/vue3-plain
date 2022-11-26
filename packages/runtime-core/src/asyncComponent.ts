import { ref } from "@vue/reactivity"
import { h } from "./h"
import { Fragment } from "./vnode"

export function defineAsyncComponent(options) {
    if (typeof options === 'function') {
        options = { loader: options }
    }

    return {
        setup() {
            let { loader, timeout, delay = 0, errorComponent, loadingComponent, onError } = options
            let loaded = ref(false)
            let isError = ref(false)
            let isLoading = ref(false)
            let loadedComponent = null
            let load = () => { 
                return loader().catch((err) => {
                    if(onError) {
                        // 这里实现了一个promise的链的递归
                        return new Promise((resolve, reject) => {
                            const retry = () => {
                                isLoading.value = true
                                isError.value = false
                                resolve(load())
                            }
                            const fail = () => reject(err)
                            onError(err, retry, fail)
                        })
                    }
                    throw new Error(err)
                })

            }
            load()
                .then((c) => {
                    loadedComponent = c
                    loaded.value = true
                }).catch(() => {
                    isError.value = true
                }).finally(() => {
                    isLoading.value = false
                })

            if (timeout) {
                setTimeout(() => {
                    isError.value = true
                }, timeout)
            }
            setTimeout(() => {
                isLoading.value = true
            }, delay)
            return () => {
                if (loaded.value) {
                    return h(loadedComponent) // 正确组件渲染
                } else if (isError.value && errorComponent) {
                    return h(errorComponent) // 错误组件渲染
                } else if (isLoading.value && loadingComponent) {
                    return h(loadingComponent) // loading组件渲染
                } else {
                    return h(Fragment, []) // 无意义组件渲染
                }
            }
        }
    }
}