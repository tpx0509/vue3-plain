import { NodeTypes, createCallExpression } from "../ast";


function isText(node) {
   return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION
}

export function transformText(node, context) {
    // 处理文本时 会有将同一个元素节点中的多个子节点拼在一起的需求 如  _toDisplayString(_ctx.name)+'123'+'abc'
    // 我们就需要判断的时遇到元素时， 处理元素里面的儿子 （也是需要在递归出来之后，进行处理）
    let currentTextNode = null
    let hasText = false
    // 需要遇到元素的时候， 才能处理多个子节点
    if (node.type === NodeTypes.ELEMENT || node.type === NodeTypes.ROOT) {
      return () => {
        let children = node.children
        for(let i= 0 ; i < children.length; i++) {
           // 找到连续的文本节点 一起处理   compile(`<div>{{aaa}} 123 <span></span> {{bbb}} 123</div>`)
           let child = children[i]
           if(isText(child)) {
              hasText = true
              for(let j=i+1; j < children.length; j++) {
                 if(isText(children[j])) {
                    if(!currentTextNode) {
                       // 把当前循环找到的第一项节点标志成一个连续的文本节点(复合表达式)
                       currentTextNode = children[i] = { 
                           type : NodeTypes.COMPOUND_EXPRESSION,
                           children : [child]
                       }
                    }
                    currentTextNode.children.push('+',children[j]) // 把第二项也push进去
                    children.splice(j--,1) // 第二项删掉，不需要了(已经合并在一起了)
                 }else {
                    currentTextNode = null
                    break;
                 }
              }
           }
        }

        if(!hasText || children.length === 1) {
          return
        }
        // 如果有文本，并且有多个孩子
        // 需要给多个儿子中的创建文本节点添加patchFlag
        // patchFlag 元素里有一个文本{{aa}}标识位应该是一个文本
        // compile(`<div>{{aaa}}  123 <span></span></div>`)
        for(let i=0; i< children.length; i++) {
           let child = children[i]
           const callArgs = []
           if(isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION ) {
              // 都是文本
              callArgs.push(child)
              if(child.type !== NodeTypes.TEXT) {
                 // 动态节点
                 callArgs.push(NodeTypes.TEXT) // 靶向更新标志
              }

              children[i] = {
                 type : NodeTypes.TEXT_CALL, // 要用createTextNode来创建
                 child,
                 codeGenNode : createCallExpression(context,callArgs)
              }
           }
        }
      };
    }
  }