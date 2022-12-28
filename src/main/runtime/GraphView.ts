import { ModuleSpecSchema } from '../schema/ModuleSpec.js';
import { GraphSpec } from '../types/model.js';
import { clone } from '../util/clone.js';
import { MultiMap } from '../util/multimap.js';
import { ModuleLoader } from './ModuleLoader.js';
import { NodeLink, NodeView } from './NodeView.js';

export class GraphView {

    constructor(
        readonly loader: ModuleLoader,
        protected graphSpec: GraphSpec,
    ) {}

    toJSON() {
        return clone(this.graphSpec);
    }

    get moduleSpec() {
        return this.graphSpec.moduleSpec;
    }

    get metadata() {
        return this.graphSpec.metadata;
    }

    get rootNodeId() {
        return this.graphSpec.rootNodeId;
    }

    isNodeExists(id: string) {
        return this.graphSpec.nodes[id] != null;
    }

    getNodeById(id: string): NodeView | null {
        const nodeSpec = this.graphSpec.nodes[id];
        return nodeSpec ? new NodeView(this, id, nodeSpec) : null;
    }

    getNodes() {
        return Object.entries(this.graphSpec.nodes).map(_ => new NodeView(this, _[0], _[1]));
    }

    getRootNode() {
        return this.getNodeById(this.graphSpec.rootNodeId);
    }

    getNodesByRef(ref: string): NodeView[] {
        const results: NodeView[] = [];
        for (const [nodeId, nodeSpec] of Object.entries(this.graphSpec.nodes)) {
            if (nodeSpec.ref === ref) {
                results.push(new NodeView(this, nodeId, nodeSpec));
            }
        }
        return results;
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
            for (const link of node.inboundLinks()) {
                map.add(link.linkNode.nodeId, link);
            }
        }
        return map;
    }

    /**
     * Returns nodes in right-to-left order based on topology.
     */
    orderNodes(nodes: Iterable<NodeView>): NodeView[] {
        const result = [...nodes];
        for (let i = 0; i < result.length; i++) {
            const node = result[i];
            for (const link of node.inboundLinks()) {
                const index = result.findIndex(_ => _.nodeId === link.linkNode.nodeId);
                if (index > -1 && index < i) {
                    result.splice(i, 1);
                    result.splice(index, 0, node);
                    i = index;
                }
            }
        }
        return result;
    }

    getSubgraphById(id: string): GraphView | null {
        const subgraphSpec = this.graphSpec.subgraphs[id];
        return subgraphSpec ? new GraphView(this.loader, {
            rootNodeId: subgraphSpec.rootNodeId,
            nodes: subgraphSpec.nodes,
            metadata: {},
            moduleSpec: ModuleSpecSchema.create({}),
            subgraphs: this.graphSpec.subgraphs,
        }) : null;
    }

    getUsedSubgraphs(): GraphView[] {
        return Object.values(this.graphSpec.nodes)
            .filter(_ => _.ref === '@system/Subgraph')
            .map(_ => this.getSubgraphById(_.metadata.subgraphId))
            .filter(Boolean) as GraphView[];
    }

    *collectAllRefs(): Iterable<string> {
        for (const subgraph of [this, ...this.getUsedSubgraphs()]) {
            for (const nodeSpec of Object.values(subgraph.graphSpec.nodes)) {
                yield nodeSpec.ref;
            }
        }
    }

    uniqueRefs() {
        return [...new Set(this.collectAllRefs())];
    }

    async loadRefs() {
        const promises = [];
        for (const moduleId of this.uniqueRefs()) {
            const promise = this.loader.loadModule(moduleId);
            promises.push(promise);
        }
        return await Promise.allSettled(promises);
    }

}
