import { DeepPartial } from '@flexent/schema';

import { GraphSpecSchema } from '../schema/index.js';
import { AddNodeSpec, DataSchemaSpec, GraphSpec, ModuleSpec } from '../types/index.js';
import { MultiMap, serialize } from '../util/index.js';
import { GraphLoader } from './GraphLoader.js';
import { Node, NodeLink } from './Node.js';

export class Graph implements GraphSpec {

    moduleSpec!: ModuleSpec;
    rootNodeId!: string;
    nodes: Node[] = [];
    metadata: Record<string, any> = {};

    protected $nodeMap = new Map<string, Node>();

    private constructor(readonly $loader: GraphLoader, graphSpec: GraphSpec) {
        Object.assign(this, graphSpec);
        this.nodes = [];
        for (const n of graphSpec.nodes) {
            const node = new Node(this, n);
            this.addNodeRaw(node);
        }
        this.applyInvariants();
    }

    static async load($loader: GraphLoader, data: DeepPartial<GraphSpec> = {}) {
        const spec = GraphSpecSchema.decode(data);
        const refs = new Set(spec.nodes.map(_ => _.ref));
        for (const moduleName of refs) {
            await $loader.loadModule(moduleName);
        }
        return new Graph($loader, spec);
    }

    toJSON() {
        return serialize(this, {
            rootNodeId: '',
        });
    }

    resolveModule(moduleName: string): ModuleSpec {
        return this.$loader.resolveModule(moduleName);
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
        this.moduleSpec.result.schema = resultSchema;
    }

    async createNode(spec: AddNodeSpec) {
        const { moduleName } = spec;
        const module = await this.$loader.loadModule(moduleName);
        const evalMode = module.evalMode;
        const node = new Node(this, {
            ...spec.node,
            ref: moduleName,
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

    applyInvariants() {
        for (const node of this.nodes) {
            node.applyInvariants();
        }
        this.moduleSpec.result.async = this.nodes.some(_ => _.$module.result.async);
    }

}
