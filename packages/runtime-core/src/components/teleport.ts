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