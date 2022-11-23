import { parse } from "./parse"
import { transform } from "./transform"


export function compile(template) {
    // 讲模板转成抽象语法树
    let ast = parse(template) // 这里需要讲html语法转换成jsx语法 编译原理
    
    // 对ast语法树进行一些预先处理,生成代码之前做一些转化
    // 收集所需的方法 createElementVnode toDisplayString ..
    // codegen 为了生成代码的时候更方便，在转化的过程中会生成这样一个属性
    // 元素、属性、表达式、文本
    transform(ast) // 会生成一些信息
    // 代码生成
    // generate(ast) // 最终生成代码
    return ast
}