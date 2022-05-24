import { getType } from './type.ts';

export function capitalizeWords(str: string) {
    return str.replace(/\b([a-zA-Z])/g, (_, letter) => letter.toUpperCase());
}

export function humanize(str: string) {
    return capitalizeWords(str.replace(/([A-Z])/g, ` $1`).trim());
}

export function createDefaultLabel(str: string) {
    const lastComponent = str.split(/[.:]/).pop() + '';
    return humanize(lastComponent);
}

export function abbreviate(val: any) {
    switch (getType(val)) {
        case 'object':
            return `{…}`;
        case 'array':
            return `[…]`;
        case 'string':
            return val.substring(0, 20) + (val.length > 20 ? '…' : '');
        case 'null':
            return 'null';
        default:
            return String(val);
    }
}
