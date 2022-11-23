import { NodeTypes } from "../ast";

export function transformText(node, context) {
    // 处理文本时 会有将同一个元素节点中的多个子节点拼在一起的需求 如  _toDisplayString(_ctx.name)+'123'+'abc'
    // 我们就需要判断的时遇到元素时， 处理元素里面的儿子 （也是需要在递归出来之后，进行处理）
  
    // 需要遇到元素的时候， 才能处理多个子节点
    if (node.type === NodeTypes.ELEMENT || node.type === NodeTypes.ROOT) {
      console.log("进入2", "transformText");
      return () => {
          console.log("出来2", "transformText");
      };
    }
  }