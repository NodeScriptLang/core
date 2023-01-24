export function toRegExp(value: unknown): RegExp {
    if (value instanceof RegExp) {
        return value;
    }
    if (typeof value === 'string') {
        return regExpFromString(value);
    }
    throw new Error(`Expected regular expression, got ${typeof value}`);
}

export function regExpFromString(value: string): RegExp {
    const m = /^\(\?([dgimsuy]+):(.*)\)$/.exec(value);
    if (m) {
        return new RegExp(m[2], m[1]);
    }
    return new RegExp(value, 'g');
}
