import { DataSchemaSpec, DataType } from '../types/data-schema.js';

export function parseAny(str: string) {
    const s = String(str ?? '').trim();
    switch (s) {
        case 'false':
            return false;
        case 'true':
            return true;
        case 'null':
            return null;
        case '':
            return '';
        default: {
            const num = Number(str);
            if (!isNaN(num)) {
                return num;
            }
            if (str.startsWith('[') || str.startsWith('{')) {
                try {
                    return JSON.parse(str);
                } catch (_err) {}
            }
            return str;
        }
    }
}

export function getType(data: unknown): DataType {
    if (data == null) {
        return 'null';
    }
    if (Array.isArray(data)) {
        return 'array';
    }
    const type = typeof data;
    if (type === 'object' || type === 'number' || type === 'string' || type === 'boolean') {
        return type;
    }
    return 'any';
}

export function isSchemaCompatible(desiredSchema: DataSchemaSpec, actualSchema: DataSchemaSpec): boolean {
    switch (desiredSchema.type) {
        case 'any':
            return true;
        case 'string':
        case 'boolean':
        case 'number':
            return actualSchema.type === desiredSchema.type;
        case 'object':
            if (actualSchema.type !== 'object') {
                return false;
            }
            if (desiredSchema.properties) {
                for (const [key, prop] of Object.entries(desiredSchema.properties)) {
                    const actualProp = (actualSchema.properties ?? {} as any)[key] ?? { type: 'any' };
                    const ok = isSchemaCompatible(prop as any, actualProp);
                    if (!ok) {
                        return false;
                    }
                }
            }
            if (desiredSchema.additionalProperties) {
                const ok = isSchemaCompatible(desiredSchema.additionalProperties, actualSchema.additionalProperties ?? { type: 'any' });
                if (!ok) {
                    return false;
                }
            }
            return true;
        case 'array':
            if (actualSchema.type !== 'array') {
                return false;
            }
            if (desiredSchema.items) {
                return isSchemaCompatible(desiredSchema.items, actualSchema.items ?? { type: 'any' });
            }
            return true;
        default:
            return false;
    }
}

export class InvalidTypeError extends Error {
    override name = this.constructor.name;
    status = 400;
}
