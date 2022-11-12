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
