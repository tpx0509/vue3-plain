import { ReactiveEffect } from "@vue/reactivity";
import { isString, ShapeFlags, isNumber, invokeArrFns, PatchFlags } from "@vue/shared";
import { patchProp } from "packages/runtime-dom/src/patchProp";
import { createComponentInstance, setupComponent, setCurrentInstance } from "./component";
import { queueJob } from "./scheduler";
import { getSequenceIndex } from "./sequence";
import { createVnode, Fragment, isSameVnode, Text, renderComponent } from "./vnode";
import { updateProps, hasPropsChange } from "./componentProps";
import { LifecycleHooks } from './apiLifecycle';

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
      const el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children); // 文本的更新
      }
    }
  };
  const processFragment = (n1, n2, container,anchor,parentComponent) => {
    if (n1 === null) {
      mountChildren(n2.children, container,anchor,parentComponent);
    } else {
      if(n2.dynamicChildren) { // fragment之间的优化，靶向更新
        // 只比较动态节点
        patchBlockChildren(n1,n2,anchor,parentComponent)
      }else {
        patchChildren(n1, n2, container,anchor,parentComponent);
      }
      
    }
  };
  const processElement = (n1, n2, container, anchor,parentComponent) => {
    if (n1 === null) {
      // 初次渲染，直接挂载即可
      mountElement(n2, container, anchor,parentComponent);
    } else {
      patchElement(n1, n2,anchor,parentComponent);
    }
  };
  const shouldUpdateComponent = (n1,n2) => {
    const { props : prevProps,children:prevChildren } = n1
    const { props : nextProps,children:nextChildren } = n2
    if(prevProps === nextProps) return false;
    if(prevChildren || nextChildren) { // 有插插就更新
       return true
    }
    return hasPropsChange(n1,n2)
  }
  const updateComponent = (n1,n2) => {
     // instance.props是响应式的，而且可以更改，属性的更新会让页面重新渲染
      // 对于元素而言是要复用dom节点，组件是要复用组件实例
      const instance = (n2.component = n1.component)
      // 需要更新就强制调用组件的update方法
      if(shouldUpdateComponent(n1,n2)) {
         instance.next = n2 // 将新的虚拟节点放到next属性上（是个临时变量，更新时需要）
         instance.update() // 统一调用update方法
      }
     
  }
  const processComponent = (n1, n2, container, anchor,parentComponent) => {
    // 统一处理组件，里面再区分是有状态组件还是函数式组件
    if (n1 === null) {
      n2.instance = mountComponent(n2, container, anchor,parentComponent);
    } else {
      // 组件的更新靠的是props
      updateComponent(n1,n2)
    }
  };

  
  const mountComponent = (vnode, container, anchor,parentComponent) => {
    // 1,创建组件实例   vnode.component 让vnode也记住组件实例
    let instance = vnode.component = createComponentInstance(vnode,parentComponent);

    // 2,给实例上赋值
    setupComponent(instance)
    // 3,创建effect

    setupRenderEffect(instance,container,anchor)
  };
  // 组件更新前执行的操作
  const updateComponentPreRender = (instance,next) => {
     instance.next = null; // next情况
     instance.vnode = next // 实例上更新虚拟节点
     updateProps(instance.props,next.props)  // 更新属性
  }
  const setupRenderEffect = (instance,container,anchor) => {

    const { render } = instance
    const componentUpdatedFn = () => {
      // 区分是初始化，还是要更新
      if (!instance.isMounted) {
        // 初始化
        // 执行onbeforeMount钩子
        invokeArrFns(instance[LifecycleHooks.ONBEFOREMOUNT])
        setCurrentInstance(instance)
        let subTree = renderComponent(instance);
        setCurrentInstance(null)
        patch(null, subTree, container, anchor,instance); // 创造了subTree的真实节点并且插入了   (最后一个参数instance，就是传给子组件的parent)
        // 执行onMounted钩子
        invokeArrFns(instance[LifecycleHooks.ONMOUNTED])
        instance.subTree = subTree;
        instance.isMounted = true;
      } else {
        // 组件内部更新
        let { next } = instance
        if(next) {
           // 更新前 需要拿到最新的属性来进行更新
           updateComponentPreRender(instance,next)
        }
        // 执行onBeforeUpdated钩子
        invokeArrFns(instance[LifecycleHooks.ONBEFOREUPDATE])
        setCurrentInstance(instance)
        let subTree = renderComponent(instance)
        setCurrentInstance(null)
        patch(instance.subTree, subTree, container, anchor);
         // 执行onUpdated钩子
        invokeArrFns(instance[LifecycleHooks.ONUPDATED])
        instance.subTree = subTree
      }
    };
    // 组件的异步更新
    let effect = new ReactiveEffect(componentUpdatedFn,() => queueJob(instance.update));
    // 将组件强制更新的逻辑保存到了组件实例上，后续可以使用
    let update = (instance.update = effect.run.bind(effect)); // 调用effect.run可以让组件强制重新渲染
    update();
  }

  const normalize = (child, i) => {
    let children = child[i];
    if (isString(children) || isNumber(children)) {
      children = child[i] = createVnode(Text, null, children);
    }
    return children;
  };

  const normalizeChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      normalize(children, i);
    }
  };
  const mountChildren = (children, container,anchor,parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalize(children, i);
      patch(null, child, container,anchor,parentComponent);
    }
  };
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };

  const mountElement = (vnode, container, anchor,parentComponent) => {
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
      mountChildren(children, el,anchor,parentComponent);
    }
    hostInsert(el, container, anchor);
  };

  const patchProps = (oldProps, newProps, el) => {
    // 把新的属性全部都添加上
    for (let key in newProps) {
      patchProp(el, key, oldProps[key], newProps[key]);
    }
    // 旧的属性，新的里面没有的，删除掉
    for (let key in oldProps) {
      if (newProps[key] == null) {
        patchProp(el, key, oldProps[key], null);
      }
    }
  };
  const patchBlockChildren = (n1,n2,anchor,parentComponent) => {
     for(let i=0; i< n2.dynamicChildren.length; i++) {
        patchElement(n1.dynamicChildren[i],n2.dynamicChildren[i],anchor,parentComponent)
     }
  }
  let time = 0
  const patchElement = (n1, n2,anchor,parentComponent) => {
    // 之前元素，现在也是元素 更新流程
    // 节点复用
    console.log(time++)
    const el = (n2.el = n1.el);

    let oldProps = n1.props || {};
    let newProps = n2.props || {};

    let { patchFlag } = n2
    if(patchFlag & PatchFlags.CLASS) {
       // 只更新class
       if(oldProps.class !== newProps.class) {
          patchProp(el,'class',null,newProps.class)
       }
    }else {
      // 全量对比属性
      patchProps(oldProps, newProps, el);
    }
    
    // 对比儿子
    if(n2.dynamicChildren) { // 元素之间的优化，靶向更新
      // 只比较动态节点
      patchBlockChildren(n1,n2,anchor,parentComponent)
    }else {
      // 全量diff比对
      patchChildren(n1, n2, el,anchor,parentComponent);
    }
    
  };
  const patchChildren = (n1, n2, el,anchor,parentComponent) => {
    let c1 = n1.children;
    let c2 = n2.children;
    let prevShapeFlag = n1.shapeFlag;
    let shapeFlag = n2.shapeFlag;
    // 新老元素无非都是有三种情况 数组/文本/空
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 新元素是文本
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1); // 新的是文本，老的是数组， 先卸载掉老的
      }
      if (c1 !== c2) {
        // 更新文本即可，
        hostSetElementText(el, c2);
      }
    } else {
      // 新元素为数组或者空
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 老的是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // diff 数组 数组
          normalizeChildren(c2);
          patchKeyedChildren(c1, c2, el);
        } else {
          // 新的为空，
          unmountChildren(c1);
        }
      } else {
        // 老的为文本或空
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 老的为文本，清空文本，再进行挂载 (老的为空就不用管了)
          hostSetElementText(el, "");
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el,anchor,parentComponent); // 新的是数组,进行挂载 （else的话就是新的是空 什么也不做）
        }
      }
    }
  };

  const patchKeyedChildren = (c1, c2, el) => {
    // 比较两个儿子的差异
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    // sync from start
    while (i <= e1 && i <= e2) {
      // 新老元素有任何一方遍历完就停止
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el); // 比较两个节点的属性和子节点
      } else {
        break; // 有不一样的就停止，尽可能减少比较的内容
      }
      i++;
    }
    // sync from end
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el); // 比较两个节点的属性和子节点
      } else {
        break; // 有不一样的就停止，尽可能减少比较的内容
      }
      e1--;
      e2--;
    }
    // common sequence + mount 同序列挂载

    // i要比e1大说明有新增的
    // i和e2之间的是新增的部分

    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          // 要添加的元素就是i到e2之间
          // 具体添加的位置是往后面添加还是往前面添加，要看i的后面还有没有元素(是否有参照物)
          let nextPos = i + 1;
          let anchor = nextPos < c2.length ? c2[nextPos].el : null;
          patch(null, c2[i], el, anchor); // 创造新节点，扔到容器中
          i++;
        }
      }
    }
    // common sequence + unmount 同序列卸载
    // i比e2大说明有要删除的的
    // i和e1之间的是删除的部分
    else if (i > e2) {
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      }
    }

    /* 开始乱序比对 */

    let s1 = i;
    let s2 = i;
    let keyToNewIndexMap = new Map(); // 记录新元素索引的map
    let toBePatchedLen = e2 - s2 + 1; // 新的乱序节点的长度
    let oIndexToNIndexArr = new Array(toBePatchedLen).fill(0); // 标记新元素对应的老的元素索引位置。如果是0，代表没有对比过，也就是老元素中没有。
    // 遍历新的乱序的节点,记录索引位置
    for (let i = s2; i < toBePatchedLen + s2; i++) {
      let indexI = c2[i];
      keyToNewIndexMap.set(indexI.key, i);
    }

    // 开始遍历老的乱序的节点，然后去新的索引map中去找，
    // 如果找到了，对比两个节点的属性和儿子差异（patch）
    // 如果老的存在，新的不存在，则需要卸载掉
    for (let i = s1; i <= e1; i++) {
      let oldChild = c1[i];
      let newIndex = keyToNewIndexMap.get(oldChild.key);
      if (newIndex === undefined) {
        unmount(oldChild);
      } else {
        // 如果找到了就记录一下位置
        oIndexToNIndexArr[newIndex - s2] = i + 1; // 加1是避免i正好是0的情况， 一会要根据这个值来进行判断，如果是0的话认为是新元素是要创建的
        patch(oldChild, c2[newIndex], el);
      }
    } // 到这里只是做了新老属性和儿子的对比，差一步移动位置

    // 优化 最长递增子序列  减少插入次数
    let increment = getSequenceIndex(oIndexToNIndexArr);
    let j = increment.length - 1;

    // 开始移动位置
    // 循环需要创建/移动的元素，挨个倒序插入
    for (let i = toBePatchedLen - 1; i >= 0; i--) {
      let newIndex = i + s2;
      let anchor = newIndex + 1 < c2.length ? c2[newIndex + 1].el : null;
      if (oIndexToNIndexArr[i] === 0) {
        // 创建元素
        patch(null, c2[newIndex], el, anchor);
      } else {
        // 移动位置
        if (i !== increment[j]) {
          // 这里应该也是一个优化，我一开始想到的是用increment.includes(i)来判断
          // 这样无疑每次都需要循环一遍，新加一个j的变量，因为是倒序插入的，j的取值也是倒序取得，所以i和increment[j]如果相等是一定能够找到的，
          // 这样相等的时候就可以跳过移动，跳过移动时将j--。继续去找下一个， 避免了每次判断时都循环increment这个数组
          hostInsert(c2[newIndex].el, el, anchor);
        } else {
          // 不需要移动了
          j--;
        }
      }
    }
  };
  const patch = (n1, n2, container, anchor = null,parentComponent = null) => {
    if (n1 === n2) return;
    if (n1 && !isSameVnode(n1, n2)) {
      // 如果不是相同的vnode，直接把旧的节点卸载掉
      unmount(n1);
      // 将n1置为null，后续就会走新的挂载流程
      n1 = null;
    }
    let { type, shapeFlag } = n2;
    switch (type) {
      case Text: // 处理文本的
        processText(n1, n2, container);
        break;
      case Fragment: // 处理fragment
        processFragment(n1, n2, container,anchor,parentComponent);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 处理元素
          processElement(n1, n2, container, anchor,parentComponent);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor,parentComponent);
        } else if(shapeFlag & ShapeFlags.TELEPORT) {
          const internals = {// 内部的一些挂载方法，更新方法
            mountChildren,
            patchChildren,
            move(vnode,container) {
              hostInsert(vnode.component ? vnode.component.subTree.el : vnode.el,container)
            }
          }
          type.process(n1,n2,container,internals) // 交给teleport组件自己处理
        }
    }
  };
  const unmount = (vnode) => {
    if(vnode.type === Fragment) {
       return unmountChildren(vnode)
    }else if(vnode.shapeFlag & ShapeFlags.COMPONENT) {
      return unmount(vnode.component.subTree);
    }
    hostRemove(vnode.el);
  };
  const render = (vnode, container) => {
    // 渲染过程是用你传入的renderOptions来渲染
    // 如果当前vnode是null，代表是要卸载掉,需要将dom节点删掉
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
