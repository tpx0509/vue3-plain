import { NodeTypes } from "./ast";


function createParserContext(template) {
    return {
        line: 1,
        column: 1,
        offset: 0,
        source: template, // 此字段会被不停地解析 slice
        orginalSource: template
    }
}


function isEnd(context) {
    return !context.source // 如果解析完毕后字符串为空表示解析完毕
}

function getCursor(context) {
     let { line,column,offset} = context
     return { line,column,offset}
}
function advancePositionWithMutation(context,source,endIndex) {
    let linesCount=0;
    let linePos=-1
    for (let i = 0; i < endIndex; i++) {
        if (source.charCodeAt(i) === 10) { // 换行
            linesCount++
            linePos = i
        }
    }
    console.log('linePos',linePos)
    context.line += linesCount
    context.column = linePos === -1 ? context.column + endIndex : endIndex - linePos
    context.offset = endIndex
}
function advanceBy(context,endIndex) {
    const { source } = context
    // 每次删掉内容的时候，都要更新最新的行列和偏移量信息
    advancePositionWithMutation(context,source,endIndex)
    context.source = source.slice(endIndex)
    console.log('行列信息',context)
}
function parseTextData(context,endIndex) {
    const rawText = context.source.slice(0,endIndex)

    advanceBy(context,endIndex)

    return rawText
    
}
function getSelection(context,start,end=getCursor(context)) {
    return {
        start,
        end,
        source : context.orginalSource.slice(start.offset,end.offset)
    }
}
function parseText(context) {
    // 看文本到哪里结束
    let { source } = context
    let endTokens = ['<', '{{']
    let endIndex = source.length
    for (let i = 0; i < endTokens.length; i++) {
        let index = source.indexOf(endTokens[i], 1)
        if (index !== -1 && endIndex > index) {// 找到了更近的结束位置
            endIndex = index
        }
    }
    // 创建行列信息
    const start = getCursor(context) // 开始
    //取内容
    const content = parseTextData(context,endIndex)
    console.log(start,context)
    // 再获取结束的位置
    return {
        type:NodeTypes.TEXT,
        content: content,
        loc:getSelection(context,start)
    }
}
function parse(template) {
    // 创建一个解析的上下文 来进行处理
    const context = createParserContext(template)
    
    // 解析规则就是一个个字符来判断，并且解析完就删除掉
    // < 元素
    // {{}}表达式
    // 文本
    const nodes = []
    while (!isEnd(context)) {
        let note
        const { source } = context
        if (source.startsWith('<')) { // 元素
            note = '元素'
        } else if (source.startsWith('{{')) {
            note = '表达式'
        }
        if (!note) { // 文本
            note = parseText(context)
            
        }
        nodes.push(note)
        console.log('nodes',nodes)
        break;
    }
}


export function compile(template) {
    // 讲模板转成抽象语法树
    let ast = parse(template) // 这里需要讲html语法转换成jsx语法 编译原理
    return ast
    // 对ast语法树进行一些预先处理
    // transform(ast) // 会生成一些信息
    // 代码生成
    // generate(ast) // 最终生成代码
}