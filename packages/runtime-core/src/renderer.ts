import { isString, ShapeFlags } from "@vue/shared";
import { patchProp } from "packages/runtime-dom/src/patchProp";
import { createVnode, isSameVnode, Text } from "./vnode";
// 创建渲染器
export function createRenderer(renderOptions) {
  const {
    // 增加 删除 修改 查询..
    insert: hostInsert,
    remove: hostRemove,
    // 设置元素中的内容
    setElementText: hostSetElementText,
    // 文本节点
    setText: hostSetText,
    querySelector: hostQuerySelector,
    parentNode: hostParentNode,
    nextsibling: hostNextSibling,
    createElement: hostCreateElement,
    createText: hostCreateText,
    patchProp: hostPatchProp,
  } = renderOptions;
  const processText = (n1, n2, container) => {
    if (n1 === null) {
      // n2的children就是文本字符串了
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
      // 之前文本现在也是文本。 更新流程
      // 节点复用
      const el = n2.el = n1.el
      if(n1.children !== n2.children) {
        hostSetText(el,n2.children) // 文本的更新
      }
    }
  };
  const normalize = (child,i) => {
    let children = child[i]
    if (isString(children)) {
      children = child[i] = createVnode(Text, null, children);
    }
    return children
  };
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalize(children,i);
      patch(null, child, container);
    }
  };
  const unmountChildren = (children) => {
    for(let i = 0; i < children.length; i++) {
       unmount(children[i])
    }
  }

  const mountElement = (vnode, container) => {
    let { type, props, children, shapeFlag } = vnode;
    let el = (vnode.el = hostCreateElement(type)); // 将真实元素挂在到这个虚拟节点上，后续用于复用节点和更新

    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 孩子可能是数组或文本（字符串）
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 数组
      mountChildren(children, el);
    }
    hostInsert(el, container);
  };

  const processElement = (n1, n2, container) => {
    if (n1 === null) {
      // 初次渲染，直接挂载即可
      mountElement(n2, container);
    } else {
      patchElement(n1,n2)
      
    }
  };
  const patchProps = (oldProps,newProps,el) =>  {
      
      // 把新的属性全部都添加上
      for(let key in newProps) {
        patchProp(el,key,oldProps[key],newProps[key])
      }
      // 旧的属性，新的里面没有的，删除掉
      for(let key in oldProps) {
         if(newProps[key] == null) {
           patchProp(el,key,oldProps[key],null)
         }
      }
  }
  const patchElement = (n1,n2) => {
      // 之前元素，现在也是元素 更新流程
      // 节点复用
      const el = n2.el = n1.el

      let oldProps = n1.props || {}
      let newProps = n2.props || {}
      // 对比属性
      patchProps(oldProps,newProps,el)
      // 对比儿子
      patchChildren(n1, n2, el);
  }
  const patchChildren = (n1,n2,el) => {
     let c1 = n1.children
     let c2 = n2.children
     let prevShapeFlag = n1.shapeFlag
     let shapeFlag = n2.shapeFlag
     // 新老元素无非都是有三种情况 数组/文本/空
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 新元素是文本
       if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
         unmountChildren(c1) // 新的是文本，老的是数组， 先卸载掉老的
       }
       if(c1 !== c2) { // 更新文本即可， 
         hostSetElementText(el,c2)
       }
    }else {
      // 新元素为数组或者空
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 老的是数组
        if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
           // diff 数组 数组
           console.log('diff')
        }else {
           // 新的为空，
           unmountChildren(c1)
        }
      }else {
        // 老的为文本或空
        console.log('老的为文本或空')
        if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
           // 老的为文本，清空文本，再进行挂载 (老的为空就不用管了)
           hostSetElementText(el,'')
        }
        if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2,el) // 新的是数组,进行挂载 （else的话就是新的是空 什么也不做）
        }
        
      }
    }
  }
  const patch = (n1, n2, container) => {
    if (n1 === n2) return;

    if(n1 && !isSameVnode(n1,n2)) {
        console.log('新旧节点没有关系，直接干掉旧的节点')
        // 如果不是相同的vnode，直接把旧的节点卸载掉
        unmount(n1)
        // 将n1置为null，后续就会走新的挂载流程
        n1 = null
    }
    let { type, shapeFlag } = n2;
    switch (type) {
      case Text: // 处理文本的
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container);
        }
      // 后续还有组件的渲染...
    }
  };
  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };
  const render = (vnode, container) => {
    // 渲染过程是用你传入的renderOptions来渲染
    // 如果当前vnode是null，代表是要卸载掉,需要将dom节点删掉
    console.log('render vnode',vnode)
    if (vnode === null) {
      // 卸载逻辑
      if (container.__vnode) {
        // 之前确实渲染过了，那么就卸载掉dom
        unmount(container.__vnode); // el
      }
    } else {
      // 这里既有初始化的逻辑，又有更新的逻辑
      patch(container.__vnode || null, vnode, container);
    }
    // 记录上次的vnode，将来对比
    container.__vnode = vnode;
  };
  return {
    render,
  };
}

// 元素更新逻辑

/// - 如果新旧完全没关系，删除旧的，添加新的
/// - 老的和新的一样，复用节点，属性可能不一样，在对比属性，更新属性
/// - 比儿子