export function serialize(object: any, omit: Record<string, any> = {}): unknown {
    const result: any = {};
    for (const [k, v] of Object.entries(object)) {
        if (k[0] === '$' || k[0] === '_') {
            continue;
        }
        if (k in omit && String(omit[k]) === String(v)) {
            continue;
        }
        result[k] = v;
    }
    return result;
}
