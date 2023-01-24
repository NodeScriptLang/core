import { anyEquals } from './compare.js';

export function merge(a: unknown, b: unknown): unknown {
    if (a == null || b == null) {
        return b ?? a;
    }
    if (anyEquals(a, b)) {
        return a;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        return mergeArrays(a, b);
    }
    if (typeof a === 'object' && typeof b === 'object') {
        return mergeObjects(a, b);
    }
    return [a, b];
}

function mergeArrays(a: unknown[], b: unknown[]): unknown[] {
    const result = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const bothArrays = Array.isArray(a[i]) && Array.isArray(b[i]);
        const val = merge(a[i], b[i]);
        if (Array.isArray(val) && !bothArrays) {
            result.push(...val);
        } else {
            result.push(val);
        }
    }
    return result;
}

function mergeObjects(a: object, b: object) {
    const result: Record<string, unknown> = { ...a };
    for (const [k, v] of Object.entries(b)) {
        const res = merge(result[k], v);
        result[k] = res;
    }
    return result;
}
