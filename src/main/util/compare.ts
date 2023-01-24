import { ComparisonOptions } from '../types/runtime-lib.js';
import { seqContains } from './seq.js';
import { getType } from './type.js';

export function anyEquals(a: any, b: any, options: ComparisonOptions = {}): boolean {
    const aType = getType(a);
    const bType = getType(b);
    switch (aType) {
        case 'object':
            return (
                bType === 'object' &&
                Object.keys(a).length === Object.keys(b).length &&
                Object.keys(a).every(k => anyEquals(a[k], b[k], options))
            );
        case 'array':
            return (
                bType === 'array' &&
                a.length === b.length &&
                a.every((ca: any, i: number) => anyEquals(ca, b[i], options))
            );
        default:
            return options.strict ? a === b : strEquals(a, b, options);
    }
}

export function anyContains(haystack: any, needle: any, options: ComparisonOptions = {}): boolean {
    const type = getType(haystack);
    switch (type) {
        case 'object':
        case 'array': {
            return deepStructContains(haystack, needle, options);
        }
        default:
            return strContains(haystack, needle, options);
    }
}

function structContains(haystack: any, needle: any, options: ComparisonOptions): boolean {
    switch (getType(haystack)) {
        case 'object': {
            if (getType(needle) === 'object') {
                const match = Object.keys(needle).every(k =>
                    structContains(haystack[k], needle[k], options)
                );
                if (match) {
                    return true;
                }
            }
            return false;
        }
        case 'array': {
            if (getType(needle) === 'array') {
                const match = seqContains(haystack, needle, (a, b) =>
                    structContains(a, b, options)
                );
                if (match) {
                    return true;
                }
            }
            return false;
        }
        default:
            return anyEquals(haystack, needle, options);
    }
}

function deepStructContains(haystack: any, needle: any, options: ComparisonOptions): boolean {
    if (structContains(haystack, needle, options)) {
        return true;
    }
    if (['object', 'array'].includes(getType(haystack))) {
        return Object.values(haystack).some(v => deepStructContains(v, needle, options));
    }
    return false;
}

export function strEquals(a: string, b: string, options: ComparisonOptions = {}): boolean {
    return options.strict ? a === b : weakString(a, options) === weakString(b, options);
}

export function strContains(a: string, b: string, options: ComparisonOptions = {}): boolean {
    return weakString(a, options).includes(weakString(b, options));
}

export function weakString(str: string, options: ComparisonOptions = {}): string {
    const {
        strict = false,
        trim = true,
        collapseWhitespace = true,
        onlyAlphaNumeric = false,
        caseSensitive = false,
    } = options;
    let val = String(str ?? '');
    if (strict) {
        return val;
    }
    if (trim) {
        val = val.trim();
    }
    if (!caseSensitive) {
        val = val.toLowerCase();
    }
    if (collapseWhitespace) {
        val = val.replace(/\s+/g, ' ');
    }
    if (onlyAlphaNumeric) {
        val = val.replace(/[^a-z0-9]/gi, '');
    }
    return val;
}

export function isEmpty(value: any) {
    switch (getType(value)) {
        case 'string':
            return value.trim() === '';
        case 'array':
            return !value.length;
        case 'null':
            return true;
        default:
            return false;
    }
}
