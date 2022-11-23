import { NodeTypes } from "../ast"

export function transformExpression(node,context) { // {{aa}} => _ctx.aa
    // console.log('node',node)
    if(node.type === NodeTypes.INTERPOLATION) {
        let content = node.content.content  
        node.content.content = `_ctx.${content}`
    }
}