import { DataSchema } from './data.js';

export interface GraphEvalContext {
    $cache: Map<string, any>;
    getLocal(key: string): unknown;
    $convertType<T>(value: unknown, schema: DataSchema<T>): T;
}
