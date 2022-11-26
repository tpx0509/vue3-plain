import { currentInstance } from ".";

// provies: parent ? parent.provies : Object.create(null)

export function provide(key,value) {
    if(!currentInstance) {
       console.warn('provide 只能在setup中使用')
       return  
    }
    let parentProvies = currentInstance.parent && currentInstance.parent.provies

    let provies = currentInstance.provies // 自己的provies
    if(parentProvies === provies) {
        // 如果当前组件有父亲，第一次provide时，当前组件的provies和父亲的provies是相等的 
        // 因为引用，也会更改父亲的provies,会导致儿子提供的属性，父亲也能用
        provies = currentInstance.provies = Object.create(provies)
        // 重置一次当前组件的provies，否则，同时将原型链指向父亲
    }
    // 这时再修改，只会更改当前组件的provies
    provies[key] = value
    console.log('currentInstance',currentInstance)
}

export function inject(key,defaultValue) {
    if(!currentInstance) {
        console.warn('inject 只能在setup中使用')
        return  
    }
    let parentProvies = currentInstance.parent && currentInstance.parent.provies

    if(parentProvies && (key in parentProvies)) { // 通过父亲的provies将结果返回
        return parentProvies[key]
    }else if(arguments.length > 1) {
        return defaultValue
    }
}