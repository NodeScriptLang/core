export function serialize<T, K extends keyof T>(object: T, omit: Record<K, any>): unknown {
    const result: any = {};
    for (const [k, v] of Object.entries(object)) {
        if (k[0] === '$' || k[0] === '_') {
            continue;
        }
        if (k in omit && String((omit as any)[k]) === String(v)) {
            continue;
        }
        result[k] = v;
    }
    return result;
}
