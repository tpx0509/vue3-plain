import { reactive } from "@vue/reactivity";
import { hasOwn } from "@vue/shared";

export function initProps(instance, rawProps) {
  const attrs = {};
  const props = instance.propsOptions || {};
  if (rawProps) {
    for (let key in rawProps) {
      const value = rawProps[key];
      if (hasOwn(props, key)) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }
  // 这里props不希望在组件内部被更改，但是props得是响应式的，
  // 因为后续属性变化了要更新试图，用的应该是shallowReactive
  // 后续自己实现一下shallowReactive
  instance.props = reactive(props);
  instance.attrs = attrs;
}

export function hasPropsChange(prevProps = {}, nextProps = {}) {
  const nextKeys = Object.keys(nextProps);
  // 新旧props的长度不一样，需要更新
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true
  }
  // 值变化了，需要更新
  for(let i= 0; i< nextKeys.length; i++) {
    const key = nextKeys[i]
     if(prevProps[key] !== nextProps[key]) {
       return true
     }
  }
  return false
}

export function updateProps(instance, prevProps, nextProps) {
  if (hasPropsChange(prevProps, nextProps)) {
    for (const key in nextProps) {
      // 触发更新
      instance.props[key] = nextProps[key]
    }
    for (let key in prevProps) {
      if (!hasOwn(nextProps, key)) {
        delete instance.props[key]
      }
    }
  }
}