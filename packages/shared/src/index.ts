export const isObject = (params) => {
    return typeof params === 'object' && params !== null
}

export const isFunction = (params) => {
    return typeof params === 'function'
}

export const isString = (params) => {
    return typeof params === 'string'
}

export const isArray = (params) => {
     return Array.isArray(params)
}

export const enum ShapeFlags {
    ELEMENT = 1,
    FUNCTION_COMPONENT = 1 << 1,
    STATEFUL_COMPONENT = 1 << 2,
    TEXT_CHILDREN = 1 << 3,
    ARRAY_CHILDREN = 1 << 4,
    SLOTS_CHILDREN = 1 << 5,
    TELEPORT = 1 << 6,
    SUSPENSE = 1 << 7,
    COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
    COMPONENT_KEEP_ALIVE = 1 << 9,
    COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTION_COMPONENT
}