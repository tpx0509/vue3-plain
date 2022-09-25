export const isObject = (params) => {
    return typeof params === 'object' && params !== null
}

export const isFunction = (params) => {
    return typeof params === 'function'
}

export const isArray = (params) => {
     return Array.isArray(params)
}