
// 渲染器内部通过process传递方法，teleport内部自己实现渲染
/* 
    两个好处
    1，可以避免渲染器逻辑代码“膨胀”
    2. 当用户没有使用Te'leport组件时，由于Teleport的渲染逻辑被分离，因此可以利用TreeShaking机制
    在最终的bundle中删除Teleport相关的代码，使得最终构建包的体积变小 
*/
export const TeleportImpl = {
     __isTeleport:true,
     process(n1,n2,container,internals) {
         let { mountChildren,patchChildren,move } = internals
         if(n1 === null) {
            let target = document.querySelector(n2.props.to)
            if(target) {
                mountChildren(n2.children,target)
            }
         }else {
             // 更新
             patchChildren(n1,n2,container) // 儿子内容变化
             if(n1.props.to !== n2.props.to) { // 传送的位置变化，需要移动
                let nextTarget = document.querySelector(n2.props.to)
                n2.children.forEach(child => {
                    move(child,nextTarget)
                } )
             }
         }
     }
}

export const isTeleport = value => value.__isTeleport;