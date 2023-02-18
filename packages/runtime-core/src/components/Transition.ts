import { nextFrame } from "@vue/shared";
export const TransitionImpl = {
  name: "Transition",
  props:{
     name : ''
  },
  setup(props, { slots }) {
    return () => {
      // 通过默认插槽获取需要过渡得元素
      let innerVnode = slots?.default();
       // 在过渡元素的vnode对象上添加transition对应的钩子函数

      const ENTER_FROM = `${props.name}-enter-from`
      const ENTER_ACTIVE = `${props.name}-enter-active`
      const ENTER_TO = `${props.name}-enter-to`

      const LEAVE_FROM = `${props.name}-leave-from`
      const LEAVE_ACTIVE = `${props.name}-leave-active`
      const LEAVE_TO = `${props.name}-leave-to`
      if(innerVnode) {
          innerVnode.transition = {
               beforeEnter(el) {
                 // 设置初始状态
                 el.classList.add(ENTER_FROM);
                 el.classList.add(ENTER_ACTIVE);
               },
               enter(el) {
                 // 在下一帧切换到结束状态
                 nextFrame(() => {
                   el.classList.remove(ENTER_FROM);
                   el.classList.add(ENTER_TO);
                   // 监听transitionend完成首位动作
                   window.addEventListener("transitionend", () => {
                     el.classList.remove(ENTER_ACTIVE);
                     el.classList.remove(ENTER_TO);
                   });
                 });
               },
               leave(el, performRemove) {
                    // 设置离场过渡的初始状态
                 el.classList.add(LEAVE_FROM);
                 el.classList.add(LEAVE_ACTIVE);
                 // 强制reflow，使得初始状态生效
                 document.body.offsetHeight;
                 // 在下一帧修改状态
                 nextFrame(() => {
                   el.classList.remove(LEAVE_FROM);
                   el.classList.add(LEAVE_TO);
                   window.addEventListener("transitionend", () => {
                     el.classList.remove(LEAVE_ACTIVE);
                     el.classList.remove(LEAVE_TO);
                     // 过渡结束后，完成dom元素的卸载
                     performRemove(el)
                   });
                 });
               },
             };
      }
     
      
      // 渲染需要过渡得元素
      return innerVnode;
    };
  },
};
