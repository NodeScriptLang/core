import { Graph } from '../model/graph.js';
import * as systemNodes from '../nodes/index.js';
import { NodeDefSchema } from '../schema/node-def.js';
import * as t from '../types/index.js';

export class GraphLoader implements t.GraphLoader {
    nodeDefs = new Map<string, t.NodeDef>();

    constructor() {
        this.defineOperator('core:Comment', systemNodes.Comment);
        this.defineOperator('core:Param', systemNodes.Param);
        this.defineOperator('core:Result', systemNodes.Result);
        this.defineOperator('core:Local', systemNodes.Local);
    }

    async loadGraph(spec: t.DeepPartial<t.Graph>): Promise<Graph> {
        const { refs = {} } = spec;
        const promises = [];
        for (const uri of Object.values(refs)) {
            if (!uri) {
                continue;
            }
            promises.push(this.loadNodeDef(uri));
        }
        await Promise.all(promises);
        return new Graph(this, spec);
    }

    async loadNodeDef(uri: string): Promise<t.NodeDef> {
        const res = await import(uri);
        if (!res.node) {
            return this.unresolved(uri);
        }
        const nodeDef = NodeDefSchema.decode(res.node);
        this.defineOperator(uri, nodeDef);
        return nodeDef;
    }

    resolveNodeDef(uri: string): t.NodeDef {
        const def = this.getNodeDef(uri);
        return def ?? this.unresolved(uri);
    }

    getNodeDef(uri: string) {
        return this.nodeDefs.get(uri) ?? null;
    }

    defineOperator(uri: string, op: t.Operator): t.NodeDef {
        const def: t.NodeDef = {
            category: [],
            description: '',
            deprecated: '',
            hidden: false,
            ...op,
        };
        this.nodeDefs.set(uri, def);
        return def;
    }

    unresolved(uri: string): t.NodeDef {
        return {
            label: 'Unresolved',
            description: '',
            deprecated: '',
            category: [],
            hidden: true,
            params: {},
            result: { type: 'any' },
            compute() {
                throw new UnresolvedNodeError(`Node definition ${uri} not found`);
            },
        };
    }
}

export class UnresolvedNodeError extends Error {
    name = this.constructor.name;
    status = 500;
}
