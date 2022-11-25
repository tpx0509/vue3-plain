export let activeEffectScope = null
class EffectScope {
    active = true
    parent = null
    effects = [] // 此scope记录的effect
    scopes = [] // effectScope 可能还要收集子集的effectScope
    constructor(detached) {
        if(!detached && activeEffectScope) { // 非独立的，并且有父亲
            activeEffectScope.scopes.push(this) // 让他记住我，将来他stop的时候，会把我也stop掉
        }
    }
    run(fn) {
        if (this.active) {
            try {
                this.parent = activeEffectScope
                activeEffectScope = this
                return fn()
            } finally {
                activeEffectScope = this.parent
                this.parent = null
            }
        }
    }
    stop() {
        if (this.active) {
            this.effects.forEach(effect => effect.stop())
            this.scopes.forEach(scope => scope.stop())
            this.active = false
        }
    }
}

export function effectScope(detached) {
    return new EffectScope(detached)
}

export function recordEffectScope(effect) {
    if (activeEffectScope && activeEffectScope.active) {
        activeEffectScope.effects.push(effect)
    }
}