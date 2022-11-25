import { CREATE_TEXT, CREATE_ELEMENT_VNODE } from "./runtimeHelpers"

export const enum NodeTypes {
     ROOT,// 根节点
     ELEMENT,// 元素
     TEXT,//文本
     COMMENT, //注释
     SIMPLE_EXPRESSION,// 简单表达式 aaa :a='aa'
     INTERPOLATION, // 模板表达式 {{aaa}}
     ATTRIBUTE, // 属性
     DIRECTIVE, // 指令
     // containers
     COMPOUND_EXPRESSION,// 复合表达式 {{aa}}abc
     IF,
     IF_BRANCH,
     FOR,
     TEXT_CALL,//文本调用
     //codegen
     VNODE_CALL, //元素调用
     JS_CALL_EXPRESSION, // js调用表达式
     JS_OBJECT_EXPRESSION // // 对象表达式
}

export function createCallExpression(context, args) {
     const callee = context.helper(CREATE_TEXT)
     return {
          type: NodeTypes.JS_CALL_EXPRESSION,
          callee,
          arguments: args
     }
}

export function createObjectExpression(properties) {
     return {
          type: NodeTypes.JS_OBJECT_EXPRESSION,
          properties
     }
}

export function createVnodeCall(context,vnodeTag,propsExpression,childrenNode) {
      context.helper(CREATE_ELEMENT_VNODE);
      return {
          type : NodeTypes.VNODE_CALL,
          tag : vnodeTag,
          props: propsExpression,
          children: childrenNode
      }
}

// TEXT_CALL -> 文本的意思  JS_CALL_EXPRESSION 调用文本表达式

// VNODE_CALL -> 元素  JS_OBJECT_EXPRESSION 属性