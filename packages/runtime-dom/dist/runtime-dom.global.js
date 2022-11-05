var VueRuntimeDOM = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/runtime-dom/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Text: () => Text,
    createRenderer: () => createRenderer,
    createVnode: () => createVnode,
    h: () => h,
    isSameVnode: () => isSameVnode,
    isVnode: () => isVnode,
    render: () => render
  });

  // packages/shared/src/index.ts
  var isObject = (params) => {
    return typeof params === "object" && params !== null;
  };
  var isString = (params) => {
    return typeof params === "string";
  };
  var isArray = (params) => {
    return Array.isArray(params);
  };

  // packages/runtime-dom/src/modules/attr.ts
  function patchAttr(el, key, value) {
    if (value) {
      el.setAttribute(key, value);
    } else {
      el.removeAttribute(key);
    }
  }

  // packages/runtime-dom/src/modules/class.ts
  function patchClass(el, name) {
    if (name === null) {
      el.removeAttribute("class");
    } else {
      el.className = name;
    }
  }

  // packages/runtime-dom/src/modules/event.ts
  function createInvoker(callback) {
    const invoker = (e) => invoker.value();
    invoker.value = callback;
    return invoker;
  }
  function patchEvent(el, eventName, nextValue) {
    let invokers = el._vei || (el._vei = {});
    let exits = invokers[eventName];
    let event = eventName.slice(2).toLowerCase();
    if (exits) {
      if (nextValue) {
        exits.value = nextValue;
      } else {
        el.removeEventListener(event, exits);
        invokers[eventName] = void 0;
      }
    } else {
      if (nextValue) {
        const invoker = invokers[eventName] = createInvoker(nextValue);
        el.addEventListener(event, invoker);
      }
    }
  }

  // packages/runtime-dom/src/modules/style.ts
  function patchStyle(el, prevValue, nextValue) {
    if (nextValue) {
      for (let key in nextValue) {
        el.style[key] = nextValue[key];
      }
    }
    if (prevValue) {
      for (let key in prevValue) {
        if (nextValue[key] == null) {
          el.style[key] = null;
        }
      }
    }
  }

  // packages/runtime-dom/src/patchProp.ts
  function patchProp(el, key, prevValue, nextValue) {
    if (key === "class") {
      patchClass(el, nextValue);
    } else if (key === "style") {
      patchStyle(el, prevValue, nextValue);
    } else if (/^on[^a-z]/.test) {
      patchEvent(el, key, nextValue);
    } else {
      patchAttr(el, key, nextValue);
    }
  }

  // packages/runtime-core/src/sequence.ts
  var start;
  var end;
  var middle;
  function getSequence(arr) {
    let result = [0];
    let p = arr.slice(0);
    for (let i2 = 0; i2 < arr.length; i2++) {
      let arrI = arr[i2];
      if (arrI !== 0) {
        let resultLastLength = result[result.length - 1];
        if (arrI > arr[resultLastLength]) {
          result.push(i2);
          p[i2] = result[result.length - 2];
          continue;
        } else {
          start = 0;
          end = result.length - 1;
          while (start < end) {
            middle = (start + end) / 2 | 0;
            if (arr[result[middle]] < arrI) {
              start = middle + 1;
            } else {
              end = middle;
            }
          }
          if (arr[result[end]] > arrI) {
            result[end] = i2;
            p[i2] = result[end - 1];
          }
        }
      }
    }
    let i = result.length;
    let last = result[i - 1];
    while (i-- > 0) {
      result[i] = last;
      last = p[last];
    }
    return result;
  }

  // packages/runtime-core/src/vnode.ts
  var Text = Symbol("Text");
  function isVnode(value) {
    return !!(value == null ? void 0 : value.__v_isVnode);
  }
  function isSameVnode(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }
  function createVnode(type, props, children = null) {
    let shapeFlag = isString(type) ? 1 /* ELEMENT */ : 0;
    const vnode = {
      type,
      props,
      children,
      key: props == null ? void 0 : props.key,
      el: null,
      shapeFlag,
      __v_isVnode: true
    };
    if (children) {
      let type2 = 0;
      if (isArray(children)) {
        type2 = 16 /* ARRAY_CHILDREN */;
      } else {
        children = String(children);
        type2 = 8 /* TEXT_CHILDREN */;
      }
      vnode.shapeFlag |= type2;
    }
    return vnode;
  }

  // packages/runtime-core/src/renderer.ts
  function createRenderer(renderOptions2) {
    const {
      insert: hostInsert,
      remove: hostRemove,
      setElementText: hostSetElementText,
      setText: hostSetText,
      querySelector: hostQuerySelector,
      parentNode: hostParentNode,
      nextsibling: hostNextSibling,
      createElement: hostCreateElement,
      createText: hostCreateText,
      patchProp: hostPatchProp
    } = renderOptions2;
    const processText = (n1, n2, container) => {
      if (n1 === null) {
        hostInsert(n2.el = hostCreateText(n2.children), container);
      } else {
        const el = n2.el = n1.el;
        if (n1.children !== n2.children) {
          hostSetText(el, n2.children);
        }
      }
    };
    const normalize = (child, i) => {
      let children = child[i];
      if (isString(children)) {
        children = child[i] = createVnode(Text, null, children);
      }
      return children;
    };
    const mountChildren = (children, container) => {
      for (let i = 0; i < children.length; i++) {
        let child = normalize(children, i);
        patch(null, child, container);
      }
    };
    const unmountChildren = (children) => {
      for (let i = 0; i < children.length; i++) {
        unmount(children[i]);
      }
    };
    const mountElement = (vnode, container, anchor) => {
      let { type, props, children, shapeFlag } = vnode;
      let el = vnode.el = hostCreateElement(type);
      if (props) {
        for (let key in props) {
          hostPatchProp(el, key, null, props[key]);
        }
      }
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(el, children);
      } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(children, el);
      }
      hostInsert(el, container, anchor);
    };
    const processElement = (n1, n2, container, anchor) => {
      if (n1 === null) {
        mountElement(n2, container, anchor);
      } else {
        patchElement(n1, n2);
      }
    };
    const patchProps = (oldProps, newProps, el) => {
      for (let key in newProps) {
        patchProp(el, key, oldProps[key], newProps[key]);
      }
      for (let key in oldProps) {
        if (newProps[key] == null) {
          patchProp(el, key, oldProps[key], null);
        }
      }
    };
    const patchElement = (n1, n2) => {
      const el = n2.el = n1.el;
      let oldProps = n1.props || {};
      let newProps = n2.props || {};
      patchProps(oldProps, newProps, el);
      patchChildren(n1, n2, el);
    };
    const patchChildren = (n1, n2, el) => {
      let c1 = n1.children;
      let c2 = n2.children;
      let prevShapeFlag = n1.shapeFlag;
      let shapeFlag = n2.shapeFlag;
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          unmountChildren(c1);
        }
        if (c1 !== c2) {
          hostSetElementText(el, c2);
        }
      } else {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            console.log("diff");
            patchKeyedChildren(c1, c2, el);
          } else {
            unmountChildren(c1);
          }
        } else {
          console.log("\u8001\u7684\u4E3A\u6587\u672C\u6216\u7A7A");
          if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
            hostSetElementText(el, "");
          }
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(c2, el);
          }
        }
      }
    };
    const patchKeyedChildren = (c1, c2, el) => {
      let i = 0;
      let e1 = c1.length - 1;
      let e2 = c2.length - 1;
      while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i];
        if (isSameVnode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        i++;
      }
      console.log(i, e1, e2);
      while (i <= e1 && i <= e2) {
        const n1 = c1[e1];
        const n2 = c2[e2];
        if (isSameVnode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        e1--;
        e2--;
      }
      console.log(i, e1, e2);
      if (i > e1) {
        if (i <= e2) {
          while (i <= e2) {
            let nextPos = i + 1;
            let anchor = nextPos < c2.length ? c2[nextPos].el : null;
            patch(null, c2[i], el, anchor);
            i++;
          }
        }
      } else if (i > e2) {
        if (i <= e1) {
          while (i <= e1) {
            unmount(c1[i]);
            i++;
          }
        }
      }
      console.log("\u5F00\u59CB\u4E71\u5E8F\u6BD4\u5BF9", i, e1, e2);
      let s1 = i;
      let s2 = i;
      let keyToNewIndexMap = /* @__PURE__ */ new Map();
      let toBePatchedLen = e2 - s2 + 1;
      let oIndexToNIndexArr = new Array(toBePatchedLen).fill(0);
      for (let i2 = s2; i2 < toBePatchedLen + s2; i2++) {
        let indexI = c2[i2];
        keyToNewIndexMap.set(indexI.key, i2);
      }
      for (let i2 = s1; i2 <= e1; i2++) {
        console.log(c1[i2]);
        let oldChild = c1[i2];
        let newIndex = keyToNewIndexMap.get(oldChild.key);
        if (newIndex === void 0) {
          unmount(oldChild);
        } else {
          oIndexToNIndexArr[newIndex - s2] = i2 + 1;
          patch(oldChild, c2[newIndex], el);
        }
      }
      console.log("keyToNewIndexMap", keyToNewIndexMap);
      console.log("toBePatchedLen", toBePatchedLen);
      console.log("oIndexToNIndexArr", oIndexToNIndexArr);
      let increment = getSequence(oIndexToNIndexArr);
      let j = increment.length - 1;
      console.log("\u9012\u589E\u5E8F\u5217", increment);
      for (let i2 = toBePatchedLen - 1; i2 >= 0; i2--) {
        let newIndex = i2 + s2;
        let anchor = newIndex + 1 < c2.length ? c2[newIndex + 1].el : null;
        if (oIndexToNIndexArr[i2] === 0) {
          patch(null, c2[newIndex], el, anchor);
        } else {
          if (i2 !== increment[j]) {
            console.log("\u79FB\u52A8\u4F4D\u7F6E", c2[newIndex].el);
            hostInsert(c2[newIndex].el, el, anchor);
          } else {
            j--;
          }
        }
      }
    };
    const patch = (n1, n2, container, anchor = null) => {
      if (n1 === n2)
        return;
      if (n1 && !isSameVnode(n1, n2)) {
        console.log("\u65B0\u65E7\u8282\u70B9\u6CA1\u6709\u5173\u7CFB\uFF0C\u76F4\u63A5\u5E72\u6389\u65E7\u7684\u8282\u70B9");
        unmount(n1);
        n1 = null;
      }
      let { type, shapeFlag } = n2;
      switch (type) {
        case Text:
          processText(n1, n2, container);
          break;
        default:
          if (shapeFlag & 1 /* ELEMENT */) {
            processElement(n1, n2, container, anchor);
          }
      }
    };
    const unmount = (vnode) => {
      hostRemove(vnode.el);
    };
    const render2 = (vnode, container) => {
      console.log("render vnode", vnode);
      if (vnode === null) {
        if (container.__vnode) {
          unmount(container.__vnode);
        }
      } else {
        patch(container.__vnode || null, vnode, container);
      }
      container.__vnode = vnode;
    };
    return {
      render: render2
    };
  }

  // packages/runtime-core/src/h.ts
  function h(type, propsOrChildren, children) {
    let l = arguments.length;
    if (l === 2) {
      if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
        if (isVnode(propsOrChildren)) {
          return createVnode(type, null, [propsOrChildren]);
        }
        return createVnode(type, propsOrChildren);
      } else {
        return createVnode(type, null, propsOrChildren);
      }
    } else {
      if (l > 3) {
        children = Array.from(arguments).slice(2);
      } else if (l === 3 && isVnode(children)) {
        children = [children];
      }
      return createVnode(type, propsOrChildren, children);
    }
  }

  // packages/runtime-dom/src/nodeOps.ts
  var nodeOps = {
    insert(child, parent, anchor = null) {
      parent.insertBefore(child, anchor);
    },
    remove(child) {
      let parentNode = child.parentNode;
      if (parentNode) {
        parentNode.removeChild(child);
      }
    },
    setElementText(el, content) {
      el.textContent = content;
    },
    setText(node, text) {
      node.nodeValue = text;
    },
    querySelector(selector) {
      return document.querySelector(selector);
    },
    parentNode(node) {
      return node.parentNode;
    },
    nextsibling(node) {
      return node.nextSibling;
    },
    createElement(tagName) {
      return document.createElement(tagName);
    },
    createText(text) {
      return document.createTextNode(text);
    }
  };

  // packages/runtime-dom/src/index.ts
  var renderOptions = Object.assign(nodeOps, { patchProp });
  function render(vnode, container) {
    return createRenderer(renderOptions).render(vnode, container);
  }
  return __toCommonJS(src_exports);
})();
