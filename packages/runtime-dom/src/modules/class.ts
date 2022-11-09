export function patchClass(el,name) {
     if(name === null) {
          el.removeAttribute('class')
     }else {
          el.className = name
     }
     
}