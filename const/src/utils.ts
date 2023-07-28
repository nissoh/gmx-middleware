

export function mapArrayBy<A, B extends string | symbol | number, R>(list: readonly A[], mapKey: (v: A) => B, mapValue: (v: A) => R) {
    const gmap = {} as { [P in B]: R }

    for (const item of list) {
        const key = mapKey(item)
        gmap[key] = mapValue(item)
    }

    return gmap
}