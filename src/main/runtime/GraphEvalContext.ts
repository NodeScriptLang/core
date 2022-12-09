import { Event } from '@nodescript/event';
import { getType, Schema } from '@nodescript/schema';

import * as t from '../types/index.js';
import { Disposable } from '../types/index.js';

export const SYM_DEFERRED = Symbol.for('NodeScript:Deferred');

export type Deferred = {
    [SYM_DEFERRED]: true;
    resolve: () => unknown;
    schema: t.DataSchema<unknown> | undefined;
};

/**
 * GraphEvalContext provides runtime tools for graph computation,
 * node caching, introspection, etc.
 */
export class GraphEvalContext implements t.GraphEvalContext {

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

    getType(value: unknown): t.DataType {
        return getType(value);
    }

    convertType<T>(value: unknown, schema: t.DataSchema<T>): T {
        return new Schema<T>(schema as any).decode(value);
    }

    checkPendingNode(nodeId: string) {
        if (this.pendingNodeIds.has(nodeId)) {
            throw new NodePendingError();
        }
    }

    deferred(fn: () => unknown, schema?: t.DataSchema<unknown> | undefined): Deferred {
        return {
            [SYM_DEFERRED]: true,
            resolve: fn,
            schema,
        };
    }

    resolveDeferred(value: unknown): unknown {
        if ((value as any)[SYM_DEFERRED]) {
            const deferred = value as Deferred;
            const { schema, resolve } = deferred;
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
}

export class NodePendingError extends Error {
    override name = this.constructor.name;
    code = 'EPENDING';
}
