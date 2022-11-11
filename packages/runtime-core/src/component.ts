import { reactive } from "@vue/reactivity";
import { hasOwn, isFunction } from "@vue/shared";
import { initProps } from "./componentProps";

export function createComponentInstance(vnode) {
  let instance = {
    // 组件的实例
    vnode, // 组件的虚拟节点
    isMounted: false,
    propsOptions: vnode.type.props,
    props: {},
    attrs: {},
    update: null,
    proxy: null,
    subTree: null, // 渲染的组件内容
    data: null,
    render: null,
  };

  return instance;
}

const publicPropertyMap = {
  $attrs: (i) => i.attrs,
};
const publicInstanceProxy = {
  get(target, key, receiver) {
    const { data, props } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    }
    if (props && hasOwn(props, key)) {
      return props[key];
    }
    let getter = publicPropertyMap[key];
    if (getter) {
      return getter(target);
    }
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    const { data, props } = target;
    if (props && hasOwn(props, key)) {
      // 用户操作的属性是代理对象，这里面被屏蔽刘瑞
      // 但是我们可以通过instance.props拿到真实的props
      console.warn("attempting to mutate prop " + (key as string));
      return false;
    } else if (data && hasOwn(data, key)) {
      data[key] = value;
      return true;
    }
    return Reflect.set(target, key, value, receiver);
  },
};
export function setupComponent(instance) {
  let { props, type } = instance.vnode;
  initProps(instance, props);
  // 给用户绑定this，返回给用户的this是一个代理
  instance.proxy = new Proxy(instance, publicInstanceProxy);

  let data = type.data;

  if (data) {
    if (!isFunction(data))
      return console.warn("data option must be a function");
    instance.data = reactive(data.call(instance.proxy));
  }

  instance.render = type.render;
}
