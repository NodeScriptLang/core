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
export abstract class BaseEvalContext implements t.GraphEvalContext {
    // Each context maintains its own cache. Subscopes have separate caches
    // and do not delegate to parent contexts.
    cache = new Map<string, any>();
    // Locals are stored per-context. Lookups delegate up the hierarchy.
    locals = new Map<string, any>();

    abstract parent: BaseEvalContext | null;
    abstract nodeEvaluated: Event<t.NodeResult>;
    abstract pendingNodeIds: Set<string>;
    abstract addDisposable(disposable: t.Disposable): void;
    abstract removeDisposable(disposable: t.Disposable): void;
    abstract disposeAll(): Promise<void>;

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

    newScope(locals: Record<string, any> = {}): t.GraphEvalContext {
        return new ChildEvalContext(this, locals);
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
}

/**
 * Top-level scope.
 */
export class GraphEvalContext extends BaseEvalContext {
    nodeEvaluated = new Event<t.NodeResult>();
    pendingNodeIds = new Set<string>();
    disposables = new Set<Disposable>();

    get parent() {
        return null;
    }

    addDisposable(disposable: t.Disposable): void {
        this.disposables.add(disposable);
    }

    removeDisposable(disposable: t.Disposable): void {
        this.disposables.delete(disposable);
    }

    async disposeAll(): Promise<void> {
        const promises = [...this.disposables].map(_ => _.dispose());
        this.disposables.clear();
        await Promise.allSettled(promises);
    }
}

/**
 * Sub-scope eval context, created when a sub-graph is evaluated.
 * Locals are passed by node implementation and are looked up hierarchically,
 * i.e. if the local is not found in one scope, the request is delegated to parent.
 *
 * Each scope has its own cache, because nodes can produce different results in different scopes.
 */
export class ChildEvalContext extends BaseEvalContext {

    constructor(
        readonly parent: BaseEvalContext,
        locals: Record<string, any> = {},
    ) {
        super();
        for (const [key, value] of Object.entries(locals)) {
            this.locals.set(key, value);
        }
    }

    get nodeEvaluated() { return this.parent.nodeEvaluated; }
    get pendingNodeIds() { return this.parent.pendingNodeIds; }

    addDisposable(disposable: t.Disposable): void {
        this.parent.addDisposable(disposable);
    }

    removeDisposable(disposable: t.Disposable): void {
        this.parent.removeDisposable(disposable);
    }

    async disposeAll(): Promise<void> {
        await this.parent.disposeAll();
    }

}

export class NodePendingError extends Error {
    override name = this.constructor.name;
    code = 'EPENDING';
}
