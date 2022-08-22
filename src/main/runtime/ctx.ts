import { getType, Schema } from 'airtight';
import { Event } from 'typesafe-event';

import * as t from '../types/index.js';

/**
 * GraphEvalContext provides runtime tools for graph computation
 * and facilitates compute features like lambdas (with sub scopes),
 * node caching, introspection, etc.
 */
export abstract class BaseContext implements t.GraphEvalContext {
    // Each context maintains its own cache. Subscopes have separate caches
    // and do not delegate to parent contexts.
    cache = new Map<string, any>();

    abstract getLocal(key: string): any;
    abstract nodeEvaluated: Event<t.NodeResult>;
    abstract pendingNodeIds: Set<string>;

    newScope(locals: Record<string, any> = {}): BaseContext {
        return new ScopeEvalContext(this, locals);
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
            throw new NodePendingError('Node evaluation is suspended.');
        }
    }
}

/**
 * Top-level scope.
 * In graphs with no lambdas this will be a single instance passed to all nodes.
 * Has no locals.
 */
export class GraphEvalContext extends BaseContext {
    nodeEvaluated = new Event<t.NodeResult>();
    pendingNodeIds = new Set<string>();

    getLocal(_key: string): any {
        return null;
    }
}

/**
 * Sub-scope eval context, created when a lambda is evaluated.
 * Locals are passed by node implementation and are looked up hierarchically,
 * i.e. if the local is not found in one scope, the request is delegated to parent.
 *
 * Each scope has its own cache, because nodes can produce different results in different scopes.
 */
export class ScopeEvalContext extends BaseContext {
    locals = new Map<string, any>();

    constructor(
        readonly parent: GraphEvalContext,
        locals: Record<string, any> = {},
    ) {
        super();
        this.locals = new Map(Object.entries(locals));
    }

    get nodeEvaluated() { return this.parent.nodeEvaluated; }
    get pendingNodeIds() { return this.parent.pendingNodeIds; }

    getLocal(key: string): any {
        const local = this.locals.get(key);
        if (local !== undefined) {
            return local;
        }
        return this.parent.getLocal(key);
    }

}

export class NodePendingError extends Error {
    name = this.constructor.name;
    code = 'EPENDING';
}
