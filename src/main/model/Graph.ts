import { DeepPartial } from '@flexent/schema';

import { GraphSpecSchema } from '../schema/index.js';
import { AddNodeSpec, DataSchemaSpec, GraphMetadata, GraphRefs, GraphSpec, ModuleSpec } from '../types/index.js';
import { MultiMap, serialize, shortId } from '../util/index.js';
import { GraphLoader } from './GraphLoader.js';
import { Node, NodeLink } from './Node.js';

export class Graph implements GraphSpec {

    module!: ModuleSpec;
    rootNodeId!: string;
    nodes: Node[] = [];
    refs: GraphRefs = {};
    metadata: GraphMetadata = {};

    protected $nodeMap = new Map<string, Node>();

    constructor(readonly $loader: GraphLoader, data: DeepPartial<GraphSpec> = {}) {
        const spec = GraphSpecSchema.decode(data);
        Object.assign(this, spec);
        this.nodes = [];
        for (const n of spec.nodes) {
            const node = new Node(this, n);
            this.addNodeRaw(node);
        }
        this.applyInvariants();
    }

    toJSON() {
        return serialize(this, {
            rootNodeId: '',
        });
    }

    resolveRefUrl(ref: string): string {
        const url = this.refs[ref] ?? '';
        return url;
    }

    resolveModule(ref: string): ModuleSpec {
        const url = this.resolveRefUrl(ref);
        return this.$loader.resolveModule(url);
    }

    getNodeById(id: string): Node | null {
        return this.$nodeMap.get(id) ?? null;
    }

    getRootNode() {
        return this.rootNodeId ? this.getNodeById(this.rootNodeId) : null;
    }

    setRootNode(nodeId: string | null) {
        const node = nodeId ? this.getNodeById(nodeId) : null;
        const resultSchema: DataSchemaSpec = node == null ? { type: 'any' } : node.$module.result.schema;
        this.rootNodeId = node ? node.id : '';
        this.module.result.schema = resultSchema;
    }

    async createNode(spec: AddNodeSpec) {
        const module = await this.$loader.loadModule(spec.url);
        const ref = this.getRefForUrl(spec.url);
        const evalMode = module.evalMode;
        const node = new Node(this, {
            ...spec.node,
            ref,
            metadata: {
                evalMode,
                ...spec.node?.metadata,
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
        const node = this.getNodeById(nodeId);
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

    protected getRefForUrl(url: string): string {
        for (const [k, v] of Object.entries(this.refs)) {
            if (v === url) {
                return k;
            }
        }
        // Generate a new one
        const ref = shortId();
        this.refs[ref] = url;
        return ref;
    }

    applyInvariants() {
        for (const node of this.nodes) {
            node.applyInvariants();
        }
        this.module.result.async = this.nodes.some(_ => _.$module.result.async);
    }

}
