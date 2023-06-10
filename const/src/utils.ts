

export function groupByKeyMap<A, B extends string | symbol | number, R>(list: readonly A[], getKey: (v: A) => B, mapFn: (v: A) => R) {
    const gmap = {} as { [P in B]: R }

    for (const item of list) {
        const key = getKey(item)
        gmap[key] = mapFn(item)
    }

    return gmap
}