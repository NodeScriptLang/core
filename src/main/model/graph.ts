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
    aux: Record<string, any> = {};

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
        const def = await this.$loader.loadNodeDef(spec.uri);
        const ref = this.getRefForUri(spec.uri);
        const evalMode = def.metadata.evalMode;
        const node = new Node(this, {
            ...spec.node,
            ref,
            aux: {
                evalMode,
                ...spec.node?.aux,
            }
        });
        this.addNodeRaw(node);
        this.applyInvariants();
        return node;
    }

    protected addNodeRaw(node: Node) {
        this.nodes.push(node);
        this.$nodeMap.set(node.id, node);
    }

    /**
     * Deletes the node.
     *
     * If its corresponding `ref` is no longer used, ref is also removed,
     * thus guaranteeing that there are no extraneous refs left in graph.
     */
    deleteNode(nodeId: string) {
        this.$nodeMap.delete(nodeId);
        const i = this.nodes.findIndex(_ => _.id === nodeId);
        if (i === -1) {
            return false;
        }
        this.nodes.splice(i, 1);
        if (this.rootNodeId === nodeId) {
            this.rootNodeId = '';
        }
        for (const key of Object.keys(this.refs)) {
            const res = this.nodes.find(node => node.ref === key);
            if (!res) {
                delete this.refs[key];
            }
        }
        this.applyInvariants();
        return true;
    }

    /**
     * Detaches the node from all other nodes.
     * All the outbound links, which would otherwise be just removed,
     * are re-created from the node plugged into its default prop.
     */
    detachNode(nodeId: string) {
        const node = this.getNodeById(nodeId);
        if (!node) {
            return;
        }
        const outboundLinks = this.computeLinkMap().get(nodeId);
        const prop = node.getDefaultProp();
        const links = prop?.getInboundLinks() ?? [];
        const inboundLink = links[0];
        if (inboundLink) {
            for (const link of outboundLinks) {
                link.prop.linkId = inboundLink.linkNode.id;
            }
        }
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
            for (const prop of node.actualProps()) {
                const linkNode = prop.getLinkNode();
                if (linkNode) {
                    map.add(linkNode.id, {
                        node,
                        prop,
                        linkNode,
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
        for (const prop of node.actualProps()) {
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
        this.metadata.async = this.nodes.some(_ => _.$def.metadata.async);
    }

}
