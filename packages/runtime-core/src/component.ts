import { reactive, proxyRefs } from "@vue/reactivity";
import { hasOwn, isFunction, isObject, ShapeFlags } from "@vue/shared";
import { initProps } from "./componentProps";


export let curInstance = null
export const getCurrentInstance = () => curInstance
export const setCurrentInstance = (instance) => curInstance = instance

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
    setupState: null,
    slots: null
  };

  return instance;
}

const publicPropertyMap = {
  $attrs: (i) => i.attrs,
  $slots: (i) => i.slots
};
const publicInstanceProxy = {
  get(target, key, receiver) {
    const { data, props, setupState } = target;
    // setup返回的值优先级最高
    if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    }
    // props和data在vue中如果名字相同了会给警告
    // 这里是优先取了data
    else if (data && hasOwn(data, key)) {
      return data[key];
    }
    else if (props && hasOwn(props, key)) {
      return props[key];
    }
    let getter = publicPropertyMap[key];
    if (getter) {
      return getter(target);
    }
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    const { data, props, setupState } = target;
    if (setupState && hasOwn(setupState, key)) {
      console.log(setupState[key])
      setupState[key] = value
      return true
    } else if (data && hasOwn(data, key)) {
      data[key] = value;
      return true;
    } else if (props && hasOwn(props, key)) {
      // 用户操作的属性是代理对象，这里面被屏蔽了
      // 但是我们可以通过instance.props拿到真实的props
      console.warn("attempting to mutate prop " + (key as string));
      return false;
    }
    return Reflect.set(target, key, value, receiver);
  },
};

function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children
  }
}
export function setupComponent(instance) {
  let { props, type, children } = instance.vnode;
  initProps(instance, props);
  initSlots(instance, children)
  // 给用户绑定this，返回给用户的this是一个代理
  instance.proxy = new Proxy(instance, publicInstanceProxy);

  let data = type.data;

  if (data) {
    if (!isFunction(data))
      return console.warn("data option must be a function");
    instance.data = reactive(data.call(instance.proxy));
  }
  let { setup } = type
  if (isFunction(setup)) {
    // setup中的context对象
    const setupContext = { // 典型的发布订阅模式
      emit(event, ...args) { // 事件的实现原理
        console.log('target', event)
        const eventName = `on${event[0].toUpperCase()}${event.slice(1)}`
        // 找到虚拟节点属性中的事件处理
        const handler = instance.vnode.props[eventName]

        handler && handler(...args)
      },
      attrs: instance.attrs,
      slots: instance.slots
    }
    setCurrentInstance(instance) // setup执行之前设置currentInstance为当前实例
    let setupResult = setup(instance.props, setupContext)
    setCurrentInstance(null)
    if (isFunction(setupResult)) {
      instance.render = setupResult;
    } else if (isObject(setupResult)) {
      instance.setupState = proxyRefs(setupResult)
    }
  }
  if (!instance.render) {
    instance.render = type.render;
  }

}
