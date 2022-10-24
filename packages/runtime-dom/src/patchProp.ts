import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";
import { patchStyle } from "./modules/style";

export function patchProp(el,key,prevValue,nextValue) {
   // 类型 el.className
   if(key === 'class') {
      patchClass(el,nextValue)
   }else if(key === 'style') {// 样式 style
      patchStyle(el,prevValue,nextValue)
   }else if(/^on[^a-z]/.test) {// 事件 events
      patchEvent(el,key,nextValue)
   }else {// 普通属性
      patchAttr(el,key,nextValue)
   }
}