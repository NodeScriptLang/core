import { GraphSchema } from '../schema/index.js';
import * as t from '../types/index.js';
import { MultiMap, serialize, shortId } from '../util/index.js';
import { Node, NodeLink } from './node.js';

export class Graph implements t.Graph {

    static schema = GraphSchema;

    metadata!: t.NodeMetadata;
    rootNodeId!: string;
    nodes: Node[];
    refs: Record<string, string> = {};
    editorData: Record<string, any> = {};

    protected $nodeMap = new Map<string, Node>();

    constructor(readonly $loader: t.GraphLoader, spec: t.GraphSpec = {}) {
        const graph = Graph.schema.decode(spec);
        Object.assign(this, graph);
        this.nodes = [];
        for (const spec of graph.nodes) {
            const node = new Node(this, spec);
            this.addNodeRaw(node);
        }
        this.applyInvariants();
    }

    toJSON() {
        return serialize(this, {
            rootNodeId: '',
            refs: {},
        });
    }

    resolveUri(ref: string): string {
        const uri = this.refs[ref] ?? '';
        return uri;
    }

    resolveNode(ref: string): t.NodeDef {
        const uri = this.resolveUri(ref);
        return this.$loader.resolveNodeDef(uri);
    }

    getNodeById(id: string): Node | null {
        return this.$nodeMap.get(id) ?? null;
    }

    getRootNode() {
        return this.rootNodeId ? this.getNodeById(this.rootNodeId) : null;
    }

    setRootNode(nodeId: string | null) {
        const node = nodeId ? this.getNodeById(nodeId) : null;
        this.rootNodeId = node ? node.id : '';
    }

    /**
     * Uses uri to load node definition & add graph ref if none exists.
     * Returns the created node.
     */
    async createNode(spec: t.AddNodeSpec) {
        await this.$loader.loadNodeDef(spec.uri);
        const ref = this.getRefForUri(spec.uri);
        const node = new Node(this, { ...spec.node, ref });
        this.addNodeRaw(node);
        this.applyInvariants();
        return node;
    }

    protected addNodeRaw(node: Node) {
        this.nodes.push(node);
        this.$nodeMap.set(node.id, node);
    }

    /**
     * Deletes both the node & its corresponding ref if unused by any other node.
     *
     * Note: deleting root node is not allowed, it should be unassigned first
     * using setRootNode
     */
    deleteNode(nodeId: string) {
        if (this.rootNodeId === nodeId) {
            return;
        }
        this.$nodeMap.delete(nodeId);
        const i = this.nodes.findIndex(_ => _.id === nodeId);
        if (i > -1) {
            this.nodes.splice(i, 1);
            for (const key of Object.keys(this.refs)) {
                const res = this.nodes.find(node => node.ref === key);
                if (!res) {
                    delete this.refs[key];
                }
            }
            return true;
        }
        return false;
    }

    /**
     * Returns an array of the nodes that have no outbound links.
     */
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
     * Returns a map of all outbound links for each node.
     */
    computeLinkMap() {
        const map = new MultiMap<string, NodeLink>();
        for (const node of this.nodes) {
            for (const prop of node.computedProps()) {
                const linkNode = prop.getLinkNode();
                if (linkNode) {
                    map.add(linkNode.id, {
                        node,
                        prop,
                        linkNode,
                        linkKey: prop.linkKey,
                    });
                }
            }
        }
        return map;
    }

    /**
     * Returns the nodes in the order they are evaluated by the compiler.
     */
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

    protected getRefForUri(uri: string): string {
        for (const [k, v] of Object.entries(this.refs)) {
            if (v === uri) {
                return k;
            }
        }
        // Generate a new one
        const ref = shortId();
        this.refs[ref] = uri;
        return ref;
    }

    applyInvariants() {
        for (const node of this.nodes) {
            node.applyInvariants();
        }
    }

}
