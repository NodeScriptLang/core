import { Schema } from 'airtight';

import { DataSchema } from '../types/data.js';

export function convertType<T>(value: unknown, schema: DataSchema<T>): T {
    return new Schema<T>(schema as any).decode(value);
}
