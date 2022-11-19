import { isObject } from './../../shared/src/index';
import { isArray, isString, ShapeFlags } from "@vue/shared";

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')
export function isVnode(value) {
     return !!(value?.__v_isVnode)
}

export function isSameVnode(n1,n2) {
    return (n1.type === n2.type) && (n1.key === n2.key)
}

export function createVnode(type,props,children = null,patchFlag=0) {
     // 组合方案 shapeFlag 标识
     // type虚拟节点有很多 ： 组件的，元素的，文本的，teleport，suspense。。。
     // 先默认string类型 

     // 如果是字符串就认为是一个元素了
     // 对象的话认为是一个有状态组件
     let shapeFlag = 
     isString(type) ? ShapeFlags.ELEMENT :
     isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0 ;
     const vnode = {
         type,
         props,
         children,
         key : props?.key,
         el:null, // 虚拟节点上对应的真实节点，后续diff算法
         __v_isVnode : true,
         shapeFlag,
         patchFlag
         
     }
     if(children) {
        let type = 0;
         if(isArray(children)) {
            type = ShapeFlags.ARRAY_CHILDREN // 有孩子且是数组
         }else if(isObject(children)) { // 有孩子且是一个对象，认为是组件的插槽
            type = ShapeFlags.SLOTS_CHILDREN
         }else {
            // 其他的认为是文本
            children = String(children)
            type = ShapeFlags.TEXT_CHILDREN 
         }
         vnode.shapeFlag |= type;  // 等价于shapeFlag = shapeFlag | type
     }
     if(currentBlock && patchFlag > 0) {
        if(vnode.type !== Fragment) { // 不收集fragment自己 因为会死循环。 自己加的， 未看源码实现
           currentBlock.push(vnode)
        }
     }
     return vnode

}

export { createVnode as createElementVNode}


export let currentBlock = null

export function openBlock() { // 用一个数组来收集多个动态节点
   currentBlock = []
}

function setupBlock(vnode) {
    vnode.dynamicChildren = currentBlock
    currentBlock = null
    return vnode
}
export function createElementBlock(type,props,children,patchFlag) {
   return setupBlock(createVnode(type,props,children,patchFlag))
}
export function toDisplayString(val) {
    return !val ? '' ? isObject(val) : JSON.stringify(val) : String(val)
}