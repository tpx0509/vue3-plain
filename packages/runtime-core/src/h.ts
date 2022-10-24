import { isArray } from '@vue/shared';
import { isObject } from '@vue/shared';
// h方法调用的方式具备多样性。内部主要使用的是createVnode

import { createVnode, isVnode } from "./vnode"

/*
    h('div')
    h('div',{ style : { "color" : "red" }})
    h('div',{ style : { "color" : "red" }},'hello')
    h('div','hello')
    h('div',null,'hello')
    h('div',null,'hello','world')
    h('div',null,[h('hello'),h('world')])
*/ 



export function h(type,propsOrChildren,children) {
    let l = arguments.length

    if(l===2) {
        // h('div',{ style : { "color" : "red" }})
        // h('div','hello')
        // h('div',h('hello))
        // h('div',[h('hello'),h('world')])
        if(isObject(propsOrChildren) && !isArray(propsOrChildren)) {
            // 只有vnode没有属性
             if(isVnode(propsOrChildren)) {
                return createVnode(type,null,[propsOrChildren])
             }
             // 只有属性，没有孩子
            return createVnode(type,propsOrChildren)
        }else {
            // 只有孩子 没有属性
            return createVnode(type,null,propsOrChildren) // 文本
        }
    }else {
        if(l>3) {
            children = Array.from(arguments).slice(2) // 除前两个 后面的都当是儿子
        }else if(l === 3 && isVnode(children)) {
            children = [children] 
        }// 统一都包装成数组
        return createVnode(type,propsOrChildren,children)
    } 
}