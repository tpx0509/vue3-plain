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
// 获取位置的信息，根据当前的上下文
function getCursor(context) {
     let { line,column,offset} = context
     return { line,column,offset}
}
// 更新信息(行，列，偏移)
function advancePositionWithMutation(context,source,endIndex) {
    let linesCount=0;
    let linePos=-1
    for (let i = 0; i < endIndex; i++) {
        if (source.charCodeAt(i) === 10) { // 换行
            linesCount++
            linePos = i // 记录换行时的位置，更新列信息的时候要减去这个
        }
    }
    context.line += linesCount
    context.column = linePos === -1 ? context.column + endIndex : endIndex - linePos
    context.offset += endIndex
}
// 会进行前进删除
function advanceBy(context,endIndex) {
    const { source } = context
    // 每次删掉内容的时候，都要更新最新的行列和偏移量信息
    advancePositionWithMutation(context,source,endIndex)
    context.source = source.slice(endIndex)
}

// 删空格
function advanceSpace(context) {
     
}
// 处理表达式
function parseInterPolation(context) {
    const start = getCursor(context)
    const closeIndex = context.source.indexOf('}}',2)  // 查找结束的大括号
    advanceBy(context,2) // 前进两步 去掉 {{
    const innerStart = getCursor(context)
    const innerEnd = getCursor(context) // 后续拿到内容再通过advancePositionWithMutation更新结束信息
    
    // 拿到原始的内容
    const rawContentLength = closeIndex - 2
    const preContent = parseTextData(context,rawContentLength) // 可以拿到大括号中的文本内容，并更新位置信息 （此时已经拿到了表达式中的内容，并且source}}前面的也删除掉了）
    let content = preContent.trim()

    let startOffset = preContent.indexOf(content) 
    // 有值的话代表前面是有空格的，需要更新信息
    if(startOffset > 0) {
        advancePositionWithMutation(innerStart,preContent,startOffset)
    }
    let endOffset = startOffset + content.length
    advancePositionWithMutation(innerEnd,preContent,endOffset)
    advanceBy(context,2) // 去掉 }}
    return {
        type : NodeTypes.INTERPOLATION, // 表达式
        content: {
             type : NodeTypes.SIMPLE_EXPRESSION, // 表达式里的内容
             content,
             loc:getSelection(context,innerStart,innerEnd)
        },
        loc : getSelection(context,start)
    }

}
// 处理文本内容，并且更新最新的偏移量信息
function parseTextData(context,endIndex) {
    const rawText = context.source.slice(0,endIndex)

    advanceBy(context,endIndex)

    return rawText
    
}
function getSelection(context,start,end?) {
    end = end || getCursor(context)
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
            note = parseInterPolation(context)
        }
        if (!note) { // 文本
            note = parseText(context)
        }
        nodes.push(note)
    }
    return nodes
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