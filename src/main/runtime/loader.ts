import * as systemNodes from '../nodes/index.js';
import * as t from '../types/index.js';

export class GraphLoader implements t.GraphLoader {
    nodeDefs = new Map<string, t.NodeDef>();

    constructor() {
        this.defineOperator('core:Comment', systemNodes.Comment);
        this.defineOperator('core:Param', systemNodes.Param);
        this.defineOperator('core:Result', systemNodes.Result);
        this.defineOperator('core:Local', systemNodes.Local);
    }

    loadGraph(spec: t.DeepPartial<t.Graph>): Promise<t.Graph> {
        throw new Error('Method not implemented.');
    }

    loadNodeDef(uri: string): Promise<t.NodeDef> {
        throw new Error('Method not implemented.');
    }

    resolveNodeDef(uri: string): t.NodeDef {
        const def = this.getNodeDef(uri);
        return def ?? this.unresolved(uri);
    }

    getNodeDef(uri: string) {
        return this.nodeDefs.get(uri) ?? null;
    }

    defineOperator(url: string, op: t.Operator): t.NodeDef {
        const def: t.NodeDef = {
            category: [],
            description: '',
            deprecated: '',
            hidden: false,
            ...op,
        };
        this.nodeDefs.set(url, def);
        return def;
    }

    unresolved(ref: string): t.NodeDef {
        return {
            label: 'Unresolved',
            description: '',
            deprecated: '',
            category: [],
            hidden: true,
            params: {},
            returns: { type: 'any' },
            compute() {
                throw new UnresolvedNodeError(`Node definition ${ref} not found`);
            },
        };
    }
}

export class UnresolvedNodeError extends Error {
    status = 500;
    name = 'UnresolvedNodeError';
}
