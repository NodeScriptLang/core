import { DataSchema, DataType } from './data-schema.js';

export interface GraphEvalContext {
    cache: Map<string, any>;
    getLocal(key: string): unknown;
    getType(value: unknown): DataType;
    convertType<T>(value: unknown, schema: DataSchema<T>): T;
    deferred(fn: () => unknown, schema?: DataSchema<unknown>): unknown;
    resolveDeferred(value: unknown): unknown;
}
