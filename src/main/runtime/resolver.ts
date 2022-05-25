import * as t from '../types/index.js';
import { createDefaultLabel } from '../util/index.js';
import * as systemNodes from './system-nodes.js';

export class NodeResolver implements t.NodeResolver {
    nodeDefs = new Map<string, t.NodeMetadata>();

    constructor() {
        this.defineNode(systemNodes.Comment);
        this.defineNode(systemNodes.Param);
        this.defineNode(systemNodes.Result);
        this.defineNode(systemNodes.Local);
    }

    getAllNodes() {
        return [...this.nodeDefs.values()];
    }

    resolveNode(ref: string): t. NodeMetadata {
        const def = this.getNodeDef(ref);
        return def ?? this.unresolved(ref);
    }

    defineNode(nodeDef: t.NodeDef): t.NodeMetadata {
        const ref = nodeDef.ref;
        const label = createDefaultLabel(ref);
        const meta: t.NodeMetadata = {
            label,
            category: [],
            description: '',
            deprecated: '',
            hidden: false,
            ...nodeDef,
        };
        this.nodeDefs.set(ref, meta);
        return meta;
    }

    getNodeDef(ref: string) {
        return this.nodeDefs.get(ref) ?? null;
    }

    unresolved(ref: string): t.NodeMetadata {
        return {
            ref: 'Unresolved',
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
    name = this.constructor.name;
}
