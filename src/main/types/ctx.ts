import { DataSchema, DataType } from './data-schema.js';
import { Disposable } from './disposable.js';

export interface GraphEvalContext {
    cache: Map<string, any>;
    getLocal<T>(key: string, defaultValue?: T): T | undefined;
    setLocal(key: string, value: unknown): void;
    getType(value: unknown): DataType;
    convertType<T>(value: unknown, schema: DataSchema<T>): T;
    deferred(fn: () => unknown, schema?: DataSchema<unknown>): unknown;
    resolveDeferred(value: unknown): unknown;
    addDisposable(disposable: Disposable): void;
    removeDisposable(disposable: Disposable): void;
    disposeAll(): Promise<void>;
}
