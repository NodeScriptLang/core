import { Graph } from '../model/graph.js';
import * as systemNodes from '../nodes/index.js';
import { NodeDefSchema } from '../schema/node-def.js';
import * as t from '../types/index.js';

export interface GraphLoaderOptions {
    ignoreFailedDefs?: boolean;
}

export class GraphLoader implements t.GraphLoader {
    nodeDefs = new Map<string, t.NodeDef>();

    constructor() {
        this.defineOperator('core:Comment', systemNodes.Comment);
        this.defineOperator('core:Param', systemNodes.Param);
        this.defineOperator('core:Result', systemNodes.Result);
        this.defineOperator('core:Local', systemNodes.Local);
    }

    async loadGraph(
        spec: t.GraphSpec = {},
        options: GraphLoaderOptions = {},
    ): Promise<Graph> {
        const { ignoreFailedDefs = false } = options;
        const { refs = {} } = spec;
        const promises = [];
        for (const uri of Object.values(refs)) {
            if (!uri) {
                continue;
            }
            const promise = this.loadNodeDef(uri)
                .catch(error => {
                    if (ignoreFailedDefs) {
                        return;
                        // TODO log error
                    }
                    throw error;
                });
            promises.push(promise);
        }
        await Promise.all(promises);
        return new Graph(this, spec);
    }

    async loadNodeDef(uri: string): Promise<t.NodeDef> {
        const existing = this.getNodeDef(uri);
        if (existing) {
            // Do not import twice
            return existing;
        }
        if (uri.startsWith('core:')) {
            // Do not import core:
            return existing ?? this.createUnresolvedDef(uri);
        }
        const res = await import(/* webpackIgnore: true */ uri);
        // TODO throw if node does not exist or cannot be decoded?
        if (!res.node) {
            return this.createUnresolvedDef(uri);
        }
        const nodeDef = NodeDefSchema.decode(res.node);
        this.defineNode(uri, nodeDef);
        return nodeDef;
    }

    resolveNodeDef(uri: string): t.NodeDef {
        const def = this.getNodeDef(uri);
        return def ?? this.createUnresolvedDef(uri);
    }

    getNodeDef(uri: string) {
        return this.nodeDefs.get(uri) ?? null;
    }

    defineOperator(uri: string, op: t.Operator): t.NodeDef {
        const metadata: t.NodeMetadata = {
            channel: 'universe',
            name: '',
            version: '1.0.0',
            tags: [],
            description: '',
            keywords: [],
            deprecated: '',
            hidden: false,
            ...op.metadata,
        };
        const nodeDef = {
            metadata,
            compute: op.compute,
        };
        this.nodeDefs.set(uri, nodeDef);
        return nodeDef;
    }

    protected defineNode(uri: string, nodeDef: t.NodeDef) {
        this.nodeDefs.set(uri, nodeDef);
    }

    protected createUnresolvedDef(uri: string): t.NodeDef {
        return {
            metadata: {
                channel: 'stdlib',
                name: 'Unresolved',
                version: '1.0.0',
                tags: [],
                label: 'Unresolved',
                description: '',
                keywords: [],
                deprecated: '',
                hidden: true,
                params: {},
                result: { type: 'any' },
            },
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
