import { NodeTypes, createObjectExpression, createVnodeCall } from "../ast";

export function transformElement(node, context) {
  // 处理文本时， 期望给所有儿子处理完后 给元素重新添加children 。
  // 所以需要在递归出来之后，进行处理
  // 实现方法就是返回一个后置函数（退出函数），等递归完了从里面一层层出来之后 执行

  if (node.type === NodeTypes.ELEMENT) {
    return () => {
        // createElementVnode(tag,{},孩子)
        let vnodeTag  = `"${node.tag}"`
        let nodeProps = node.props
        let properties= []
        for(let i=0; i < nodeProps.length; i++) {
            properties.push({
               key : nodeProps[i].name,
               value : nodeProps[i].value.content
            })
        }
        // 创建一个属性的表达式
        let propsExpression = properties.length > 0 ? createObjectExpression(context) : null
        // 处理孩子
        let childrenNode = null
        if(node.children.length === 1) {
           childrenNode = node.children[0]
        }else if(node.children.length > 1) {
          childrenNode = node.children
        }
        node.codegenNode = createVnodeCall(context,vnodeTag,propsExpression,childrenNode)
    };
  }
}
