import { NodeTypes } from "./ast";

// vue设计思想把这里叫做递归下降算法
// parseChildren 解析函数是整个状态机的核心，状态迁移操作都在该函数内完成。在 parseChildren 函数运行过程中，为了处理标签节点，
// 会调用 parseElement 解析函数，这会间接地调用 parseChildren 函数，并产生一个新的状态机。随着标签嵌套层次的增加，
// 新的状态机会随着parseChildren 函数被递归地调用而不断创建，这就是“递归下降”中“递归”二字的含义。
// 而上级 parseChildren 函数的调用用于构造上级模板 AST 节点，被递归调用的下级 parseChildren 函数则用于构造下级模板 AST 节点。
// 最终，会构造出一棵树型结构的模板 AST，这就是“递归下降”中“下降”二字的含义

export function parse(template) {
    // 创建一个解析的上下文 来进行处理
    const context = createParserContext(template)
    
    // 解析规则就是一个个字符来判断，并且解析完就删除掉
    // < 元素
    // {{}}表达式
    // 文本
    let start = getCursor(context)
    // 包裹一层Fragment
    return createRoot(parseChildren(context),getSelection(context,start)) 
    
}
// 创建根节点
function createRoot(children,loc) {
    return {
        type : NodeTypes.ROOT,
        children,
        loc
    }
}

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
    if(context.source.startsWith('</')) {
        return true
    }
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
function advanceBySpaces(context) {
    let match = /^[ \t\r\n]+/.exec(context.source)
    if(match) {
        advanceBy(context,match[0].length)
    }
}
function parseAttributeValue(context) {
     const start = getCursor(context)
     let quote = context.source[0]
     let content
     if(quote === '"' || quote === "'") { // 有引号
          advanceBy(context,1) // 删'
          const endIndex = context.source.indexOf(quote) // 找到另一个引号
          content = parseTextData(context,endIndex);
          advanceBy(context,1) // 删'
     }else {
        const endIndex = context.source.search(/\s|>/) // 找到空格位置|>就是结束(如果属性值没有被引号引用，那么在剩余模板内容中，下一个空白字符之前的所有字符都应该作为属性值)
        content = parseTextData(context,endIndex);
     }
     return {
         content,
         loc : getSelection(context,start)
     }
}

function parseAttribute(context) {
    let start = getCursor(context)
    let match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)
    if(match) {
        let name = match[0] // 属性的名字
        advanceBy(context,name.length)
        advanceBySpaces(context)
        advanceBy(context,1) // 删掉=
        let value = parseAttributeValue(context)
        return {
            type : NodeTypes.ATTRIBUTE,
            name,
            value : {
                type : NodeTypes.TEXT,
                ...value
            },
            loc : getSelection(context,start)
        }
    }
   
     
}
function parseAttributes(context) {
    let props = []
    while(context.source.length > 0 && !context.source.startsWith('>')) {
         const prop = parseAttribute(context)
         props.push(prop)
         advanceBySpaces(context)
    }
    return props
}

function parseTag(context) {
    const start = getCursor(context)
    const match = /^<\/?([a-z][^ \t\r\n>]*)/.exec(context.source)
    const tag = match[1] // 标签名
    advanceBy(context,match[0].length) // 删除整个标签
    advanceBySpaces(context)
    // 处理属性
    let props = parseAttributes(context)

    let isSelfClosing = context.source.startsWith('/>') // 是不是自闭和标签 <img />
    advanceBy(context,isSelfClosing?2:1)
    // 内容
    return {
        type: NodeTypes.ELEMENT,
        props,
        tag,
        isSelfClosing,
        children:[],
        loc : getSelection(context,start)
    }
}
// 处理元素
function parseElement(context) {
    // <div>123</div> <img />
    let ele = parseTag(context)
    // 处理标签中间的内容
    let children = parseChildren(context) // 有可能没有儿子，所以isEnd函数里面加个判断 结束标签开头的就跳过
    ele.children = children
    // </div>
    // 如果有结束标签，直接干掉
    if(context.source.startsWith('</')) {
        parseTag(context) // 这个就可以直接删掉结束标签，返回值不关心
        // 更新位置信息
        ele.loc = getSelection(context,ele.loc.start)
    }
    return ele
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

function parseChildren(context) {
    const nodes = []
    // 当解析器遇到开始标签时，会将该标签压入父级节点栈，同时开启新的状态机。
    // 当解析器遇到结束标签，并且父级节点栈中存在与该标签同名的开始标签节点时，会停止当前正在运行的状态机
    while (!isEnd(context)) {
        let node
        const { source } = context
        if (source.startsWith('<')) { // 元素
            node = parseElement(context)
        } else if (source.startsWith('{{')) {
            node = parseInterPolation(context)
        }
        if (!node) { // 文本
           node = parseText(context)
        }
        nodes.push(node)
    }
    nodes.forEach((node,i) => {
       if(node.type === NodeTypes.TEXT) {
            if(!/[^\t\r\n\f ]/.test(node.content)) {// 过滤掉空节点
                nodes[i] = null
            }
        } 
    })
    return nodes.filter(Boolean)
}