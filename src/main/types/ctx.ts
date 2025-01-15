import { Event } from 'nanoevent';

import { RuntimeLib } from './runtime-lib.js';
import { SchemaSpec } from './schema.js';

export interface Deferred {
    resolve: () => unknown;
}

export interface GraphEvalContext {
    readonly lib: RuntimeLib;

    nodeUid: string;
    cache: Map<string, any>;
    locals: Map<string, any>;
    nodeEvaluated: Event<NodeResult>;
    scopeCaptured: Event<ScopeData>;

    clear(): void;
    finalize(): Promise<void>;
    newScope(): GraphEvalContext;
    getScopeData(): any;
    setScopeData(data: any): this;
    checkPendingNode(nodeUid: string): void;

    getLocal<T>(key: string, defaultValue?: T): T | undefined;
    setLocal(key: string, value: unknown): void;

    convertType(value: unknown, schema: SchemaSpec): unknown;
    convertAuto(value: string, schema?: SchemaSpec): unknown;
    get(object: unknown, keyish: string): unknown;
    set(object: unknown, keyish: string, value: unknown): void;
    toArray(object: unknown): unknown[];

    deferred(fn: () => unknown): unknown;
    isDeferred(value: unknown): value is Deferred;
    resolveDeferred(value: unknown): unknown;
}

export interface NodeResult {
    nodeUid: string;
    result?: any;
    error?: any;
    progress?: number;
}

export interface ScopeData {
    nodeUid: string;
    params: any;
}
