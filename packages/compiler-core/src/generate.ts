import { helperMap, TO_DISPLAY_STRING, OPEN_BLOCK, CREATE_ELEMENT_BLOCK, CREATE_ELEMENT_VNODE } from "./runtimeHelpers"
import { NodeTypes } from "./ast"



function createCodegenContext(ast) {
    const context = {
        code : '', // 最后生成的代码
        helper(name) {
            return `${helperMap[name]}`
        },
        push(code) {
            context.code += code
        },
        indentLevel : 0,
        indent() {
            ++context.indentLevel
            context.newLine()
        },
        deindent(withOutNewLine = false) {
            --context.indentLevel
            if(!withOutNewLine) {
                context.newLine()
            }
        },
        newLine() {
            context.push('\n'+'  '.repeat(context.indentLevel))
        }
    }
    return context
}

function genFunctionPreable(ast,context) {
    if(!ast.helpers.length) return;
    let helpersStr = ast.helpers.map(name => `${context.helper(name)} as _${context.helper(name)}`).join(',')
    context.push(`import { ${helpersStr} } from "vue"`)
    context.newLine()
    context.push('export ')
}


function genText(node,context) {
    context.push(JSON.stringify(node.content))
}
function genIntepolation(node,context) {
    context.push(`_${helperMap[TO_DISPLAY_STRING]}(`)
    genNode(node.content,context)
    context.push(')')
}
function genExpression(node,content) {
    content.push(node.content)
}
function genVnodeCall(node,content) { // 自己写的，
    debugger
     if(node.isBlock) {
        content.push(`( _${helperMap[OPEN_BLOCK]}(),_${helperMap[CREATE_ELEMENT_BLOCK]}(`)
        content.push(`${node.tag},null,[`)
        content.indent()
        if(node.children.length) {
            node.children.forEach((node) => {
                genNode(node.codegenNode,content)
            })
        }else {
            genNode(node.children.codegenNode,content)
        }
        content.push(']))')
     }else {
         let nodeProps = node.props ? genNode(node.props,content): null
         content.push(`_${helperMap[CREATE_ELEMENT_VNODE]}(`)
         content.push(`${node.tag},${JSON.stringify(nodeProps)},`)
         genNode(node.children,content)
         content.push(')')
         content.newLine()
     }
     
}
function genElement(node,content) {
    content.push(`[_${helperMap[CREATE_ELEMENT_VNODE]}(`)
    genNode(node.codegenNode,content)
}
function genObjectExpression(node,content) {
    return node.properties.reduce((obj,item) => {
        obj[item.key] = item.value
        return obj
    },{})
}
function genNode(node,context) {
    switch(node.type) {
         case NodeTypes.TEXT:
            genText(node,context)
            break;
         case NodeTypes.INTERPOLATION:
            genIntepolation(node,context)
            break;
        case NodeTypes.SIMPLE_EXPRESSION:
            genExpression(node,context)
            break;
            // 后续都是自己写的，可能有bug
        // 元素 =》 元素对象-》元素的儿子 递归
        case NodeTypes.VNODE_CALL:
            genVnodeCall(node,context)
            break;
        case NodeTypes.ELEMENT:
            genElement(node,context)
            break;
        case NodeTypes.JS_OBJECT_EXPRESSION:
            return genObjectExpression(node,context)
        // fragment

        // ...
         
    }
}

export function generate(ast) {
    const context = createCodegenContext(ast)
    const { push,indent,deindent } = context
    genFunctionPreable(ast,context)

    const functionName = 'render'
    let args = ['_ctx','_cache','$props']
    push(`function ${functionName}(${args.join(',')}) {`)
    indent()

    push('return ')
    if(ast.codegenNode) {
        genNode(ast.codegenNode,context)
    }else {
        push('null')
    }
    deindent()
    push('}')
    console.log(context.code)
}