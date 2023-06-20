import { Event } from 'nanoevent';

import { NodeResult } from './node-result.js';
import { RuntimeLib } from './runtime-lib.js';
import { SchemaSpec } from './schema.js';

export interface Deferred {
    resolve: () => unknown;
    // TODO drop schema (left for compatibility)
    schema: SchemaSpec | undefined;
}

export interface GraphEvalContext {
    readonly lib: RuntimeLib;

    cache: Map<string, any>;
    locals: Map<string, any>;
    nodeEvaluated: Event<NodeResult>;
    scopeCaptured: Event<ScopeData>;

    clear(): void;
    finalize(): Promise<void>;
    newScope(): GraphEvalContext;

    getLocal<T>(key: string, defaultValue?: T): T | undefined;
    setLocal(key: string, value: unknown): void;

    convertType(value: unknown, schema: SchemaSpec): unknown;
    convertAuto(value: string, schema?: SchemaSpec): unknown;
    get(object: unknown, keyish: string): unknown;
    set(object: unknown, keyish: string, value: unknown): void;
    toArray(object: unknown): unknown[];
    checkPendingNode(nodeUid: string): void;

    // TODO drop schema (left for compatibility)
    deferred(fn: () => unknown, schema?: SchemaSpec): unknown;
    isDeferred(value: unknown): value is Deferred;
    resolveDeferred(value: unknown): unknown;
}

export interface ScopeData {
    scopeId: string;
    params: any;
}
