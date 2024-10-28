import { getDefaultValue, getType, Schema } from 'airtight';

import { SchemaSpec } from '../types/schema.js';
import { parseJson } from './json.js';

export { getType };

export function convertAuto(value: string, targetSchema: SchemaSpec = { type: 'any' }) {
    if (targetSchema.type === 'any') {
        return convertAnyVal(value);
    }
    let val: any = value;
    if (value === '') {
        if (targetSchema.optional) {
            return undefined;
        }
        if (targetSchema.nullable) {
            return null;
        }
        val = getDefaultValue(targetSchema);
    }
    if (targetSchema.type === 'object' || targetSchema.type === 'array') {
        val = parseJson(val, undefined);
    }
    return new Schema(targetSchema as any).decode(val);
}

export function convertAnyVal(value: string) {
    switch (value) {
        case '':
        case 'undefined':
            return undefined;
        case `''`:
        case `""`:
            return '';
        case 'null':
            return null;
        case 'true':
            return true;
        case 'false':
            return false;
        case '{}':
            return {};
        case '[]':
            return [];
        default: {
            if (/^[+-]?[0-9]/.test(value)) {
                const num = Number(value);
                if (!isNaN(num)) {
                    return num;
                }
            }
            return value;
        }
    }
}

export function isSchemaCompatible(desiredSchema: SchemaSpec, actualSchema: SchemaSpec): boolean {
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
