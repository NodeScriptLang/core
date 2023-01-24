import { SchemaDef } from 'airtight';

import { Disposable } from './disposable.js';
import { RuntimeLib } from './runtime-lib.js';
import { SchemaSpec } from './schema.js';

export interface Deferred {
    resolve: () => unknown;
    schema: SchemaDef | undefined;
}

export interface GraphEvalContext {
    readonly lib: RuntimeLib;

    nodeId: string;
    cache: Map<string, any>;

    clear(): void;

    getLocal<T>(key: string, defaultValue?: T): T | undefined;
    setLocal(key: string, value: unknown): void;

    convertType(value: unknown, schema: SchemaSpec): unknown;
    convertAuto(value: string, schema?: SchemaSpec): unknown;

    deferred(fn: () => unknown, schema?: SchemaDef<unknown>): unknown;
    isDeferred(value: unknown): value is Deferred;
    resolveDeferred(value: unknown): unknown;

    trackDisposable(key: string, disposable: Disposable): void;
    dispose(key: string): Promise<void>;
    disposeAll(): Promise<void>;
}
