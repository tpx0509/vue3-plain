import { getCurrentInstance } from "../component"
import { onMounted, onUpdated } from "../apiLifecycle"
import { isVnode } from "../vnode"
import { ShapeFlags } from "@vue/shared"


function resetShapeFlag(vnode) {
    let shapeFlag = vnode.shapeFlag
    if(shapeFlag & ShapeFlags.COMPONENT_KEEP_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_KEEP_ALIVE
    }
    if(shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
    }
    vnode.shapeFlag = shapeFlag
}
export const KeepAliveImpl = {
    __isKeepAlive: true,
    props:{
        include:'', // 哪些需要缓存
        exclude:'', // 哪些不需要缓存
        max:999 // 最大缓存量
    },
    setup(props, { slots }) { // keep-alive本身没有功能，渲染的是插槽
        let pendingCacheKey = null
        let instance = getCurrentInstance()
        // 我怎么操作dom元素，渲染过程中传给我(在mountComponent的过程中会给keepAlive组件提供方法)
        let { move, createElement } = instance.ctx.renderer
        let storageContainer = createElement('div') // 为了临时存在缓存节点的一个dom,稍后我们要将渲染好的组件移入进去
        // KeepAlive组件的实例上会添加两个内部函数deactivate和activate,这两个函数会在渲染器中被调用
        instance.ctx.deactivate = (vnode) => {
            move(vnode, storageContainer)
        }
        instance.ctx.activate = (vnode,container) => {
            move(vnode, container)
        }
        function cacheSubTree() {
            if (pendingCacheKey) {
                // 组件在卸载时会调用
                cache.set(pendingCacheKey, instance.subTree) // 挂载完毕后缓存当前实例对应的subTree
            }
        }
        onMounted(cacheSubTree)
        onUpdated(cacheSubTree)

        const keys = new Set(); // 缓存的key
        let cache = new Map(); // 哪个key，对应的是哪个虚拟节点
        let { include, exclude, max } = props
        let current = null
        function pruneCacheEntry(key) {
            keys.delete(key)
            cache.delete(key)
            // 重置shapeFlag，让unmount时可以卸载掉
            resetShapeFlag(current)
        }
        return () => {
            
            
            // keepAlive默认会取slots的default属性，返回的虚拟节点的第一个
            let vnode = slots.default()
            // 看一下vnode是不是组件，只有组件才能缓存
            // 必须是虚拟节点，而且是有状态组件
            if (!isVnode(vnode) || !(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
                return vnode
            }
            const comp = vnode.type;
            const key = vnode.key ?? comp

            let name = comp.name // 可以根据组件的名字来决定是否需要缓存
            // 不需要缓存
            if(name && (include && !include.split(',').includes(name)) || (exclude && exclude.split(',').includes(vnode.name))) {
                return vnode
            }
            let cacheVnode = cache.get(key)
            if (cacheVnode) {
                vnode.component = cacheVnode.component // 复用缓存的节点
                vnode.shapeFlag |= ShapeFlags.COMPONENT_KEEP_ALIVE // 标识初始化的时候，不要走创建了
                keys.delete(key) // 把原来所在位置删掉
                keys.add(key) // 放在最后，使其成为最新使用的
            } else {
                keys.add(key)
                pendingCacheKey = key
                if(max && keys.size > max) {
                    pruneCacheEntry(keys.values().next().value)// 把第一项，最远的（最久未使用的）那项给删掉
                }
            }
            vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE // 标志这个组件应该缓存,卸载的时候不该真卸载
            current = vnode
            return vnode // 组件
        }
    }
}

export const isKeepAlive = (vnode) => vnode.type.__isKeepAlive