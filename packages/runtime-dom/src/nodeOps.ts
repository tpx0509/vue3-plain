export const nodeOps = {
    // 增加 删除 修改 查询..
    insert(child,parent,anchor = null) {
        // anchor参照物 如果为null的话insertBefore等价于appendChild
        parent.insertBefore(child,anchor);
    },
    remove(child) {
         let parentNode = child.parentNode;
         if(parentNode) {
            parentNode.removeChild(child)
         }
    },
    // 设置元素中的内容
    setElementText(el,content) {
        // 不能用innerHTML. 危险操作 可以执行js
        el.textContent = content
    },
    // 文本节点
    setText(node,text) {
        node.nodeValue = text
    },
    querySelector(selector) {
        return document.querySelector(selector)
    },
    parentNode(node) {
         return node.parentNode
    },
    nextsibling(node) {
        return node.nextSibling
    },
    createElement(tagName) {
        return document.createElement(tagName)
    },
    createText(text) {
        return document.createTextNode(text)
    }
}