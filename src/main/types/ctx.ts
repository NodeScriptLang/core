import { DataSchema, DataType } from './data.js';

export interface GraphEvalContext {
    cache: Map<string, any>;
    getLocal(key: string): unknown;
    getType(value: unknown): DataType;
    convertType<T>(value: unknown, schema: DataSchema<T>): T;
}
