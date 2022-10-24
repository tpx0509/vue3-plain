export function patchStyle(el,prevValue,nextValue) {
    if(nextValue) { // 把新的style全给上
      for(let key in nextValue) {
        el.style[key] = nextValue[key]
      }   
    }
    if(prevValue) { // 把旧的style（新的里面没有的）全干掉
        for(let key in prevValue) {
            if(nextValue[key] === null) {
                el.style[key] = null
            }
             
        }
    }
    
}