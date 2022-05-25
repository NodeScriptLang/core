import { DeepPartial } from 'airtight';

import { GraphSchema } from '../schema/index.js';
import * as t from '../types/index.js';
import { MultiMap, serialize } from '../util/index.js';
import { Node, NodeLink } from './node.js';

export class Graph implements t.Graph {

    static schema = GraphSchema;

    ref!: string;
    label!: string;
    category!: string[];
    description!: string;
    deprecated!: string;
    hidden!: boolean;
    rootNodeId!: string;
    params: Record<string, t.ParamMetadata> = {};
    returns: t.DataSchema<any> = { type: 'any' };

    nodes: Node[];

    protected $nodeMap = new Map<string, Node>();

    constructor(readonly $resolver: t.NodeResolver, spec: DeepPartial<t.Graph> = {}) {
        const graph = Graph.schema.decode(spec);
        Object.assign(this, graph);
        this.nodes = [];
        for (const spec of graph.nodes) {
            this.addNode(spec);
        }
    }

    toJSON() {
        return serialize(this, {
            label: '',
            description: '',
            deprecated: '',
            hidden: false,
            category: [],
            params: {},
            rootNodeId: '',
        });
    }

    getNodeById(id: string): Node | null {
        return this.$nodeMap.get(id) ?? null;
    }

    getRootNode() {
        return this.rootNodeId ? this.getNodeById(this.rootNodeId) : null;
    }

    addNode(spec: DeepPartial<t.Node> = {}) {
        const node = new Node(this, spec);
        this.nodes.push(node);
        this.$nodeMap.set(node.id, node);
        return node;
    }

    deleteNode(nodeId: string) {
        this.$nodeMap.delete(nodeId);
        const i = this.nodes.findIndex(_ => _.id === nodeId);
        if (i > -1) {
            this.nodes.splice(i, 1);
            return true;
        }
        return false;
    }

    rightmostNodes(): Node[] {
        const candidates = new Set(this.nodes);
        for (const node of this.nodes) {
            for (const link of node.inboundLinks()) {
                candidates.delete(link.linkNode);
            }
        }
        return [...candidates];
    }

    *allLinks(): Iterable<NodeLink> {
        for (const node of this.nodes) {
            yield* node.inboundLinks();
        }
    }

    /**
     * Returns a map of fromNodeId -> set of toNodeId.
     */
    getDepMap() {
        const map = new MultiMap<string, Node>();
        for (const node of this.nodes) {
            for (const prop of node.computedProps()) {
                const linkNode = prop.getLinkNode();
                if (linkNode) {
                    map.add(linkNode.id, node);
                }
            }
        }
        return map;
    }

    computeOrder(nodeId: string = this.rootNodeId): Node[] {
        const order: Node[] = [];
        const node = this.getNodeById(nodeId ?? this.rootNodeId);
        if (node) {
            this._computeOrder(order, node);
        }
        return order;
    }

    protected _computeOrder(order: Node[], node: Node) {
        order.unshift(node);
        for (const prop of node.computedProps()) {
            const linkNode = prop.getLinkNode();
            if (linkNode) {
                const i = order.findIndex(_ => _.id === linkNode.id);
                if (i > -1) {
                    order.splice(i, 1);
                }
                this._computeOrder(order, linkNode);
            }
        }
    }

}
