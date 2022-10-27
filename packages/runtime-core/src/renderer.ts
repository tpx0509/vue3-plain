import { isString, ShapeFlags } from '@vue/shared';
import { createVnode, Text } from './vnode';
// 创建渲染器
export function createRenderer(renderOptions) {
   const {
      // 增加 删除 修改 查询..
      insert:hostInsert,
      remove:hostRemove,
      // 设置元素中的内容
      setElementText: hostSetElementText,
      // 文本节点
      setText : hostSetText,
      querySelector: hostQuerySelector,
      parentNode : hostParentNode,
      nextsibling: hostNextSibling,
      createElement : hostCreateElement,
      createText : hostCreateText,
      patchProp:hostPatchProp
     } = renderOptions
   const processText = (n1,n2,container) => {
      if(n1 === null) {
        // n2的children就是文本字符串了
        hostInsert(n2.el = hostCreateText(n2.children),container)
      }else {
         // 更新流程
      }
  }
  const normalize = (child) => {
     if(isString(child)) {
        return createVnode(Text,null,child)
     }
     return child
 }
  const mountChildren = (children,container) => {
      for(let i=0; i< children.length; i++) {
        let child = normalize(children[i])
         patch(null,child,container)
      }
  }
  
  const mountElement = (vnode,container) => {
     let { type,props,children,shapeFlag } = vnode
     let el = vnode.el = hostCreateElement(type) // 将真实元素挂在到这个虚拟节点上，后续用于复用节点和更新

     if(props) {
         for(let key in props) {
           hostPatchProp(el,key,null,props[key])
         }
     }
     // 孩子可能是数组或文本（字符串）
     if(shapeFlag & ShapeFlags.TEXT_CHILDREN) { // 文本
        hostSetElementText(el,children)
     }else if( shapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 数组
        mountChildren(children,el)
     }
     hostInsert(el,container)
  }
 
  const processElement = (n1,n2,container) => {
      if(n1 === null) {
         // 初次渲染，直接挂载即可
         mountElement(n2,container)

      }else {
         // 更新流程
      //   patchElement()
      }
  }

   const patch = (n1,n2,container) => {
      if(n1 === n2) return;

      let { type,shapeFlag} = n2
      
      switch(type) {
            case Text : // 处理文本的
            processText(null,n2,container)
            break;
         default :
         // 元素的初次渲染
            if(shapeFlag & ShapeFlags.ELEMENT) {
               processElement(n1,n2,container)
            }
            // 后续还有组件的初次渲染...
      }
   }
     const unmount = (vnode) => {
        hostRemove(vnode.el)
     }
     const render = (vnode,container) => { // 渲染过程是用你传入的renderOptions来渲染
       console.log('vnode',vnode)
        // 如果当前vnode是null，代表是要卸载掉,需要将dom节点删掉
        if(vnode === null) {
           // 卸载逻辑
           if(container.__vnode) { // 之前确实渲染过了，那么久卸载掉dom
             unmount(container.__vnode) // el
           }
        }else {
          // 这里既有初始化的逻辑，又有更新的逻辑
          patch(container.__vnode || null,vnode,container)
        }
        // 记录上次的vnode，将来对比
        container.__vnode = vnode
     }
     return {
        render
     }
}


