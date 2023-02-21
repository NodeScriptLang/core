import { Schema } from 'airtight';
import { Event } from 'nanoevent';

import * as t from '../types/index.js';
import { Disposable, SchemaSpec } from '../types/index.js';
import { runtimeLib } from '../util/runtime-lib.js';

export const SYM_DEFERRED = Symbol.for('NodeScript:Deferred');

/**
 * GraphEvalContext provides runtime tools for graph computation,
 * node caching, introspection, etc.
 */
export class GraphEvalContext implements t.GraphEvalContext {
    readonly lib = runtimeLib;

    nodeId: string = '';
    pendingNodeIds: Set<string>;
    nodeEvaluated: Event<t.NodeResult>;
    disposables: Map<string, Disposable>;
    // Each context maintains its own cache. Subscopes have separate caches
    // and do not delegate to parent contexts.
    cache = new Map<string, any>();
    // Locals are stored per-context. Lookups delegate up the hierarchy.
    locals = new Map<string, any>();

    constructor(readonly parent: GraphEvalContext | null = null) {
        this.nodeEvaluated = parent ? parent.nodeEvaluated : new Event();
        this.pendingNodeIds = parent ? parent.pendingNodeIds : new Set();
        this.disposables = parent ? parent.disposables : new Map();
    }

    clear() {
        this.cache.clear();
        this.locals.clear();
        this.disposables.clear();
        this.pendingNodeIds.clear();
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

    toArray(value: unknown): unknown[] {
        return Array.isArray(value) ? value : [value];
    }

    convertType(value: unknown, schema: SchemaSpec) {
        return new Schema(schema as any).decode(value);
    }

    convertAuto(value: string, targetSchema: SchemaSpec = { type: 'any' }) {
        if (value === '') {
            if (targetSchema.optional) {
                return undefined;
            }
            if (targetSchema.nullable) {
                return null;
            }
        }
        if (targetSchema.type === 'any') {
            return this.convertAnyVal(value);
        }
        return this.convertType(value, targetSchema);
    }

    private convertAnyVal(value: string) {
        switch (value) {
            case '':
                return '';
            case 'undefined':
                return undefined;
            case 'null':
                return null;
            case 'true':
                return true;
            case 'false':
                return false;
            case '{}':
                return {};
            case '[]':
                return [];
            default: {
                const num = Number(value);
                if (!isNaN(num)) {
                    return num;
                }
                return value;
            }
        }
    }

    checkPendingNode(nodeId: string) {
        if (this.pendingNodeIds.has(nodeId)) {
            throw new NodePendingError();
        }
    }

    deferred(fn: () => unknown, schema?: SchemaSpec): Deferred {
        return new Deferred(fn, schema);
    }

    isDeferred(value: unknown): value is t.Deferred {
        return value != null && (value as any)[SYM_DEFERRED];
    }

    resolveDeferred(value: unknown): unknown {
        if (this.isDeferred(value)) {
            const { schema, resolve } = value;
            const val = resolve();
            if (schema) {
                if (val instanceof Promise) {
                    return val.then(v => this.convertType(v, schema));
                }
                return this.convertType(val, schema);
            }
            return val;
        }
        return value;
    }

    trackDisposable(key: string, disposable: t.Disposable): void {
        this.disposables.set(key, disposable);
    }

    async dispose(key: string) {
        const disposable = this.disposables.get(key);
        this.disposables.delete(key);
        if (disposable) {
            await disposable.dispose();
        }
    }

    async disposeAll(): Promise<void> {
        const promises = [...this.disposables.values()].map(_ => _.dispose());
        this.disposables.clear();
        await Promise.allSettled(promises);
    }

    /**
     * @deprecated This is kept for compatibility with earlier versions of stdlib node.
     */
    readonly get = runtimeLib.get;

    /**
     * @deprecated This is kept for compatibility with earlier versions of stdlib node.
     */
    readonly set = runtimeLib.set;
}

export class NodePendingError extends Error {
    override name = this.constructor.name;
    code = 'EPENDING';
}

export class Deferred implements t.Deferred {

    constructor(
        readonly resolve: () => unknown,
        readonly schema: SchemaSpec | undefined,
    ) {}

    get [SYM_DEFERRED]() {
        return true;
    }

}
