import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";
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
export function transform(ast) {
  // 对树进行遍历
  const context = createTransformContext(ast);
  traverse(ast, context);
}
