import { DataSchema, DataType } from './data-schema.js';
import { Disposable } from './disposable.js';

export interface GraphEvalContext {
    nodeId: string;
    cache: Map<string, any>;
    clear(): void;
    getLocal<T>(key: string, defaultValue?: T): T | undefined;
    setLocal(key: string, value: unknown): void;
    getType(value: unknown): DataType;
    convertType<T>(value: unknown, schema: DataSchema<T>): T;
    deferred(fn: () => unknown, schema?: DataSchema<unknown>): unknown;
    resolveDeferred(value: unknown): unknown;
    trackDisposable(key: string, disposable: Disposable): void;
    dispose(key: string): Promise<void>;
    disposeAll(): Promise<void>;
}
