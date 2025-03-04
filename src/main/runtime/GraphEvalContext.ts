import { Schema } from 'airtight';
import { Event } from 'nanoevent';

import * as t from '../types/index.js';
import { SchemaSpec, TraceData } from '../types/index.js';
import { convertAuto, runtimeLib } from '../util/index.js';

export const SYM_DEFERRED = Symbol.for('NodeScript:Deferred');
export const SYM_PENDING = Symbol.for('NodeScript:Pending');
export const SYM_SKIPPED = Symbol.for('NodeScript:Skipped');

/**
 * GraphEvalContext provides runtime tools for graph computation,
 * node caching, introspection, etc.
 */
export class GraphEvalContext implements t.GraphEvalContext {

    readonly lib = runtimeLib;

    nodeUid = '';
    pendingNodeUids: Set<string>;
    nodeEvaluated: Event<t.NodeResult>;
    scopeCaptured: Event<t.ScopeData>;
    // Each context maintains its own cache. Subscopes have separate caches
    // and do not delegate to parent contexts.
    cache = new Map<string, any>();
    // Locals are stored per-context. Lookups delegate up the hierarchy.
    locals = new Map<string, any>();
    // Error traces are stored on main context and inherited by child contexts.
    errorTrace: TraceData[] = [];

    // Scope data is maintained by each context separately.
    // Compiler populates it via setScopeData when emitting nodes with subgraphs.
    private scopeData: any = undefined;

    constructor(
        readonly parent: GraphEvalContext | null = null,
    ) {
        this.nodeEvaluated = parent ? parent.nodeEvaluated : new Event();
        this.scopeCaptured = parent ? parent.scopeCaptured : new Event();
        this.pendingNodeUids = parent ? parent.pendingNodeUids : new Set();
        this.errorTrace = parent ? parent.errorTrace : [];
    }

    clear() {
        this.cache.clear();
        this.locals.clear();
        this.pendingNodeUids.clear();
    }

    async finalize() {}

    get depth(): number {
        return this.parent ? this.parent.depth + 1 : 0;
    }

    getLocal<T>(key: string, defaultValue?: T): T | undefined {
        const val = this.locals.get(key);
        if (val === undefined) {
            if (this.parent) {
                return this.parent.getLocal(key);
            }
            return defaultValue ?? undefined;
        }
        return val;
    }

    setLocal(key: string, value: unknown) {
        if (value === undefined) {
            this.locals.delete(key);
        } else {
            this.locals.set(key, value);
        }
    }

    newScope(): t.GraphEvalContext {
        return new GraphEvalContext(this);
    }

    getScopeData() {
        return this.scopeData;
    }

    setScopeData(data: any) {
        this.scopeData = data;
        return this;
    }

    convertType(value: unknown, schema: SchemaSpec) {
        return new Schema(schema as any).decode(value);
    }

    get(object: unknown, keyish: string) {
        return this.lib.get(object, keyish);
    }

    set(object: unknown, keyish: string, value: unknown) {
        return this.lib.set(object, keyish, value);
    }

    toArray(value: unknown): unknown[] {
        return Array.isArray(value) ? value : [value];
    }

    convertAuto(value: string, targetSchema: SchemaSpec = { type: 'any' }) {
        return convertAuto(value, targetSchema);
    }

    checkPendingNode(nodeUid: string) {
        if (this.pendingNodeUids.has(nodeUid)) {
            throw new NodePendingError();
        }
    }

    skipEvaluation(
        message?: string,
        token?: string,
        status?: number,
    ) {
        throw new EvaluationSkippedError(message ?? 'Evaluation skipped', token, status);
    }

    isControlException(error: any): boolean {
        if (!error) {
            return false;
        }
        return error[SYM_PENDING] || error[SYM_SKIPPED];
    }

    deferred(fn: () => unknown): Deferred {
        return new Deferred(fn);
    }

    isDeferred(value: unknown): value is t.Deferred {
        return (value as any)?.[SYM_DEFERRED];
    }

    resolveDeferred(value: unknown): unknown {
        if (this.isDeferred(value)) {
            const { resolve } = value;
            return resolve();
        }
        return value;
    }

    /**
     * @deprecated kept for backwards compatibility
     */
    span() {}

}

export class NodePendingError extends Error {

    override name = this.constructor.name;
    code = 'EPENDING';

    get [SYM_PENDING]() {
        return true;
    }

}

export class EvaluationSkippedError extends Error {

    code = 'ESKIPPED';
    status = 204;
    token = '';

    constructor(
        message: string,
        token?: string,
        status?: number,
    ) {
        super(message);
        this.token = token ?? '';
        this.status = status ?? 204;
    }

    get [SYM_SKIPPED]() {
        return true;
    }

}

export class Deferred implements t.Deferred {

    resolve: () => unknown;

    constructor(
        resolve: () => unknown,
    ) {
        this.resolve = resolve;
    }

    get [SYM_DEFERRED]() {
        return true;
    }

}
