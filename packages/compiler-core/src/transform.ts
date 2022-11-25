import { NodeTypes, createVnodeCall } from "./ast";
import { TO_DISPLAY_STRING, CREATE_ELEMENT_VNODE, OPEN_BLOCK, CREATE_ELEMENT_BLOCK,FRAGMENT } from "./runtimeHelpers";
import { transformElement } from "./transforms/transformElement";
import { transformExpression } from "./transforms/transformExpression";
import { transformText } from "./transforms/transformText";



function createTransformContext(root) {
  const context = {
    currentNode: root, // 当前正在转化的是谁
    parent: null, // 当前转化的父节点
    helpers: new Map(), // 优化 超过20个相同节点会被字符串化
    helper(name) {
      // 根据使用过的方法进行优化
      let count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1);
      return name
    },
    removeHelper(name) {
      let count = context.helpers.get(name);
      if(count) {
         const currentCount = count - 1
         if(!currentCount) {
            context.helpers.delete(name)
         }else {
            context.helpers.set(name,currentCount)
         }
      }
    },
    // 节点的转化方法
    nodeTransforms: [transformElement, transformText, transformExpression],
  };
  return context;
}

function traverse(node, context) {
  context.currentNode = node; // 记住当前遍历节点
  const transforms = context.nodeTransforms;
  let exitsFns = []; // 要在递归遍历完 回退的时候执行  (每一个函数都会返回一个退出函数)
  for (let i = 0; i < transforms.length; i++) {
    let transForm = transforms[i];
    let onExit = transForm(node, context);
    if (onExit) {
      exitsFns.push(onExit);
    }
    // 有可能执行完后这个node被删除了，直接跳过后续子节点遍历
    if (!context.currentNode) return;
  }
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING); // 需要个toDisplayString方法
      break;
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      for (let i = 0; i < node.children.length; i++) {
        context.parent = node;
        traverse(node.children[i], context);
      }
      break;
  }
  // 执行回退函数之前重置currentNode，确保指向正确
  // 因为时闭包，所以currentNode会指向回退时的那个正确的节点
  context.currentNode = node;
  let i = exitsFns.length;
  while(i--) {
    exitsFns[i]();
  }
    
}

function createRootCodegen(ast,context) {
  let { children } = ast
  // 只有一个根节点
  if(children.length === 1) {
       let child = children[0]
      // 只处理元素， 如果只有一个文本，不需要处理
      if(child.type === NodeTypes.ELEMENT && child.codegenNode) {
          ast.codegenNode = child.codegenNode
          // 不再调用createElementVnode，调用的是openBlock和createElementBlock
          context.removeHelper(CREATE_ELEMENT_VNODE)
          context.helper(OPEN_BLOCK)
          context.helper(CREATE_ELEMENT_BLOCK)
          ast.codegenNode.isBlock = true // 只有一个元素，那么当前元素是一个block节点，并且使用的是createElementBlock
      }else {
         ast.codegenNode = child.codegenNode
      }
  }else {
      // 多个根节点，调用的是openBlock和createElementBlock,同时将tag替换成fragment
      ast.codegenNode = createVnodeCall(context,context.helper(FRAGMENT),null,children)
      context.helper(OPEN_BLOCK)
      context.helper(CREATE_ELEMENT_BLOCK)
      ast.codegenNode.isBlock = true
  }

  console.log(context.helpers.keys())
}
export function transform(ast) {
  // 对树进行遍历
  const context = createTransformContext(ast);
  traverse(ast, context);

  // 再对根节点做一层转化
  // 如果有两个根节点。需要加Fragment
  // 如果只有一个节点，并且只有一个孩子，需要将createElementVnode 换成 openBlock和createElementBlock
  createRootCodegen(ast,context)
}
