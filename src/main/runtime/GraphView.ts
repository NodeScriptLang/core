import { GraphSpec } from '../types/model.js';
import { MultiMap } from '../util/multimap.js';
import { GraphLoader } from './GraphLoader.js';
import { NodeLink, NodeView } from './NodeView.js';

// TODO make sure `async` is set when async modules are used!
export class GraphView {

    constructor(
        public loader: GraphLoader,
        public graphSpec: GraphSpec,
    ) {}

    getNodeById(id: string): NodeView | null {
        const nodeSpec = this.graphSpec.nodes.find(_ => _.id === id);
        return nodeSpec ? new NodeView(this, nodeSpec) : null;
    }

    getNodes() {
        return this.graphSpec.nodes.map(_ => new NodeView(this, _));
    }

    /**
     * Returns an array of the nodes that have no outbound links.
     */
    rightmostNodes(): NodeView[] {
        const nodes = this.getNodes();
        const candidates = new Set(this.getNodes());
        for (const node of nodes) {
            for (const link of node.inboundLinks()) {
                candidates.delete(link.linkNode);
            }
        }
        return [...candidates];
    }

    *allLinks(): Iterable<NodeLink> {
        for (const node of this.getNodes()) {
            yield* node.inboundLinks();
        }
    }

    /**
     * Returns a map of all outbound links for each node.
     */
    computeLinkMap() {
        const map = new MultiMap<string, NodeLink>();
        for (const node of this.getNodes()) {
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
    computeOrder(nodeId: string = this.graphSpec.rootNodeId): NodeView[] {
        const order: NodeView[] = [];
        const node = this.getNodeById(nodeId);
        if (node) {
            this._computeOrder(order, node);
        }
        return order;
    }

    protected _computeOrder(order: NodeView[], node: NodeView) {
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

}
