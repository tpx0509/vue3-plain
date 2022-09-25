var VueReactivity = (() => {
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

  // packages/reactivity/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    computed: () => computed,
    effect: () => effect,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    ref: () => ref,
    toRef: () => toRef,
    toRefs: () => toRefs,
    watch: () => watch
  });

  // packages/reactivity/src/effect.ts
  var activeEffect = null;
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.active = true;
      this.parent = null;
      this.deps = [];
    }
    run() {
      try {
        if (!this.active) {
          return this.fn();
        }
        this.parent = activeEffect;
        activeEffect = this;
        cleanupEffect(this);
        return this.fn();
      } finally {
        activeEffect = this.parent;
        this.parent = null;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        cleanupEffect(this);
      }
    }
  };
  var targetDeps = /* @__PURE__ */ new WeakMap();
  function track(target, key, type) {
    if (!activeEffect)
      return;
    let depMaps = targetDeps.get(target);
    if (!depMaps) {
      targetDeps.set(target, depMaps = /* @__PURE__ */ new Map());
    }
    let deps = depMaps.get(key);
    if (!deps) {
      depMaps.set(key, deps = /* @__PURE__ */ new Set([]));
    }
    let shouldTract = !deps.has(activeEffect);
    if (shouldTract) {
      deps.add(activeEffect);
      activeEffect.deps.push(deps);
    }
    trackEffect(deps);
    console.log("\u4F9D\u8D56\u6536\u96C6map", targetDeps);
  }
  function trackEffect(deps, type) {
    if (type === "computed") {
      console.log("computed\u53D6\u503C\u7684\u65F6\u5019\u6536\u96C6\u4F9D\u8D56", activeEffect, deps);
    }
    if (activeEffect) {
      let shouldTract = !deps.has(activeEffect);
      if (shouldTract) {
        deps.add(activeEffect);
        activeEffect.deps.push(deps);
      }
    }
  }
  function trigger(target, key, value, oldValue, type) {
    let targetDep = targetDeps.get(target);
    if (targetDep) {
      let effects = targetDep.get(key);
      triggerEffect(effects);
    }
  }
  function triggerEffect(effects) {
    if (effects) {
      effects = new Set(effects);
      effects.forEach((effect2) => {
        if (activeEffect !== effect2) {
          if (effect2.scheduler) {
            effect2.scheduler();
          } else {
            effect2.run();
          }
        }
      });
    }
  }
  function cleanupEffect(effect2) {
    let { deps } = effect2;
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect2);
    }
    effect2.deps.length = 0;
  }
  function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  }

  // packages/shared/src/index.ts
  var isObject = (params) => {
    return typeof params === "object" && params !== null;
  };
  var isFunction = (params) => {
    return typeof params === "function";
  };
  var isArray = (params) => {
    return Array.isArray(params);
  };

  // packages/reactivity/src/baseHandler.ts
  var mutableHandlers = {
    get(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */) {
        return true;
      }
      console.log("get", target, key);
      track(target, key, "get");
      let result = Reflect.get(target, key, receiver);
      if (isObject(result)) {
        return reactive(result);
      }
      return result;
    },
    set(target, key, value, receiver) {
      console.log("set", target, key);
      let oldValue = target[key];
      let result = Reflect.set(target, key, value, receiver);
      if (oldValue !== value) {
        trigger(target, key, value, oldValue, "set");
      }
      return result;
    }
  };

  // packages/reactivity/src/reactive.ts
  function isReactive(value) {
    return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
  }
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  function reactive(target) {
    if (!isObject(target)) {
      return;
    }
    let exisitingProxy = reactiveMap.get(target);
    if (exisitingProxy) {
      return exisitingProxy;
    }
    if (target["__v_isReactive" /* IS_REACTIVE */]) {
      return target;
    }
    let proxy = new Proxy(target, mutableHandlers);
    reactiveMap.set(target, proxy);
    return proxy;
  }

  // packages/reactivity/src/computed.ts
  var ComputedRefImpl = class {
    constructor(getter, setter) {
      this.getter = getter;
      this.setter = setter;
      this.deps = /* @__PURE__ */ new Set();
      this._dirty = true;
      this.__v_isRef = true;
      this.__v_isReadonly = true;
      this.effect = new ReactiveEffect(getter, () => {
        console.log("\u6570\u636E\u53D8\u5316\u4E86scheduler");
        if (!this._dirty) {
          this._dirty = true;
          triggerEffect(this.deps);
        }
      });
    }
    get value() {
      trackEffect(this.deps, "computed");
      if (this._dirty) {
        this._dirty = false;
        this._value = this.effect.run();
      }
      return this._value;
    }
    set value(value) {
      this.setter(value);
    }
  };
  function computed(getterOrOptions) {
    let onlyGetter = isFunction(getterOrOptions);
    let getter;
    let setter;
    if (onlyGetter) {
      getter = getterOrOptions;
      setter = () => {
        console.warn("Write operation failed: computed value is readonly");
      };
    } else {
      getter = getterOrOptions.get;
      setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter);
  }

  // packages/reactivity/src/watch.ts
  function traversal(value, set = /* @__PURE__ */ new Set()) {
    if (!isObject(value))
      return value;
    if (set.has(value)) {
      return value;
    }
    set.add(value);
    for (let key in value) {
      traversal(value[key], set);
    }
    return value;
  }
  function watch(source, cb) {
    let getter;
    if (isReactive(source)) {
      console.log("\u54CD\u5E94\u5F0F\u6570\u636E", source);
      getter = () => traversal(source);
    } else if (isFunction(source)) {
      getter = source;
    }
    let oldValue;
    let clean;
    let onCleanup = (fn) => {
      clean = fn;
    };
    const job = () => {
      clean && clean();
      let newValue = _effect.run();
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    };
    let _effect = new ReactiveEffect(getter, job);
    oldValue = _effect.run();
  }

  // packages/reactivity/src/ref.ts
  function toReactive(value) {
    return isObject(value) ? reactive(value) : value;
  }
  var RefImpl = class {
    constructor(_rawValue) {
      this._rawValue = _rawValue;
      this.deps = /* @__PURE__ */ new Set();
      this.__v_isRef = true;
      this._value = toReactive(_rawValue);
    }
    get value() {
      trackEffect(this.deps);
      return this._value;
    }
    set value(newValue) {
      if (newValue !== this._rawValue) {
        this._value = toReactive(newValue);
        triggerEffect(this.deps);
        this._rawValue = newValue;
      }
    }
  };
  function ref(value) {
    return new RefImpl(value);
  }
  var ObjectRefImpl = class {
    constructor(_object, _key) {
      this._object = _object;
      this._key = _key;
      this.__v_isRef = true;
    }
    get value() {
      return this._object[this._key];
    }
    set value(newValue) {
      this._object[this._key] = newValue;
    }
  };
  function toRef(object, key) {
    return new ObjectRefImpl(object, key);
  }
  function toRefs(object) {
    if (!isReactive(object)) {
      console.error("\u8BF7\u4F20\u5165reactive\u5BF9\u8C61");
      return object;
    }
    let result = isArray(object) ? new Array(object.length) : {};
    for (let key in object) {
      result[key] = toRef(object, key);
    }
    return result;
  }
  function isRef(value) {
    return !!(value && value["__v_isRef"]);
  }
  function proxyRefs(object) {
    return new Proxy(object, {
      get(target, key, receiver) {
        let result = Reflect.get(target, key, receiver);
        return isRef(result) ? result.value : result;
      },
      set(target, key, value, receiver) {
        let oldValue = target[key];
        if (isRef(oldValue)) {
          oldValue.value = value;
        }
        return Reflect.set(target, key, value, receiver);
      }
    });
  }
  return __toCommonJS(src_exports);
})();
