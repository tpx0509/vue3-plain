import { NodeTypes } from "../ast";

export function transformElement(node, context) {
    // 处理文本时， 期望给所有儿子处理完后 给元素重新添加children 。
    // 所以需要在递归出来之后，进行处理
    // 实现方法就是返回一个后置函数（退出函数），等递归完了从里面一层层出来之后 执行
    
    if (node.type === NodeTypes.ELEMENT) {
      console.log("进入1", "transformElement");
      return () => {
        console.log("出来1", "transformElement");
      };
    }
  }
  