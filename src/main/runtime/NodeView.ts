import { PropSpecSchema } from '../schema/PropSpec.js';
import { NodeSpec } from '../types/model.js';
import { ModuleSpec, NodeEvalMode } from '../types/module.js';
import { clone } from '../util/clone.js';
import { createSubgraphModuleSpec } from '../util/graph.js';
import { GraphView } from './GraphView.js';
import { PropEntryView, PropLineView, PropView } from './PropView.js';

export class NodeView {

    /**
     * Returns nodes in right-to-left order based on topology.
     */
    static orderNodes(nodes: Iterable<NodeView>): NodeView[] {
        const result = [...nodes];
        for (let i = 0; i < result.length; i++) {
            const node = result[i];
            for (const link of node.inboundLinks()) {
                const index = result.findIndex(_ => _.nodeUid === link.linkNode.nodeUid);
                if (index > -1 && index < i) {
                    result.splice(i, 1);
                    result.splice(index, 0, node);
                    i = index;
                }
            }
        }
        return result;
    }

    private _moduleSpec: ModuleSpec | null = null;
    private _nodeUid: string;

    constructor(
        readonly graph: GraphView,
        readonly localId: string,
        readonly nodeSpec: NodeSpec,
    ) {
        const { ref } = nodeSpec;
        if (ref === '@system/Result') {
            this.nodeSpec.ref = '@system/Output';
        }
        this._nodeUid = this.graph.scopeId + ':' + localId;
    }

    toJSON() {
        return clone(this.nodeSpec);
    }

    get loader() {
        return this.graph.loader;
    }

    get ref() {
        return this.nodeSpec.ref;
    }

    get metadata() {
        return this.nodeSpec.metadata;
    }

    get nodeUid() {
        return this._nodeUid;
    }

    isParamNode() {
        return this.ref === '@system/Param';
    }

    isOutputNode() {
        return this.ref === '@system/Output';
    }

    isFrameNode() {
        return this.ref === '@system/Frame';
    }

    isCommentNode() {
        return this.ref === '@system/Comment';
    }

    async reloadModuleSpec() {
        this._moduleSpec = await this.loader.loadModule(this.ref);
    }

    getModuleSpec() {
        if (!this._moduleSpec) {
            this._moduleSpec = this.loader.resolveModule(this.ref);
        }
        return this._moduleSpec;
    }

    isRoot() {
        return this.graph.rootNodeId === this.localId;
    }

    supportsSubgraph() {
        const { subgraph } = this.getModuleSpec();
        return !!subgraph;
    }

    getSubgraph(): GraphView | null {
        const { subgraph } = this.getModuleSpec();
        if (!subgraph) {
            return null;
        }
        const { nodes = {}, rootNodeId = '', metadata = {} } = this.nodeSpec.subgraph ?? {};
        const moduleSpec = createSubgraphModuleSpec(subgraph);
        return new GraphView(this.loader, {
            moduleSpec,
            nodes,
            rootNodeId,
            metadata,
        }, this);
    }

    getProps(): PropView[] {
        const props: PropView[] = [];
        for (const key of Object.keys(this.getModuleSpec().params)) {
            const prop = this.getProp(key);
            if (prop) {
                props.push(prop);
            }
        }
        return props;
    }

    getProp(key: string): PropView | null {
        const paramSpec = this.getModuleSpec().params[key];
        if (!paramSpec) {
            return null;
        }
        const propSpec = this.nodeSpec.props[key] ?? PropSpecSchema.create({});
        return new PropView(this, key, propSpec);
    }

    getDefaultProp(): PropView | null {
        const firstProp = this.getProps()[0];
        // TODO add support to customize via ModuleSpec
        return firstProp ?? null;
    }

    isExpanded() {
        for (const _ of this.expandedLines()) {
            return true;
        }
        return false;
    }

    *allLines(): Iterable<PropLineView> {
        for (const prop of this.getProps()) {
            yield prop;
            if (prop.isUsesEntries()) {
                for (const entry of prop.getEntries()) {
                    yield entry;
                }
            }
        }
    }

    *effectiveLines(): Iterable<PropLineView> {
        for (const prop of this.getProps()) {
            if (prop.isUsesEntries()) {
                for (const entry of prop.getEntries()) {
                    yield entry;
                }
            } else {
                yield prop;
            }
        }
    }

    *expandedLines(): Iterable<PropLineView> {
        for (const line of this.effectiveLines()) {
            if (line.isExpanded()) {
                yield line;
            }
        }
    }

    getOutboundLinks(linkMap = this.graph.computeLinkMap()) {
        return linkMap.get(this.localId);
    }

    *inboundLinks(): Iterable<NodeLink> {
        for (const prop of this.getProps()) {
            const linkNode = prop.getLinkNode();
            if (linkNode) {
                yield {
                    node: this,
                    linkNode,
                    prop,
                    linkKey: prop.linkKey,
                };
            }
            if (prop.isSupportsEntries()) {
                for (const entry of prop.getEntries()) {
                    const linkNode = entry.getLinkNode();
                    if (linkNode) {
                        yield {
                            node: this,
                            linkNode,
                            prop,
                            entry,
                            linkKey: entry.linkKey,
                        };
                    }
                }
            }
        }
    }

    /**
     * Returns this node, plus all the nodes connect to its inbound sockets, recursively.
     *
     * This can also be thought of as a list of node's transitive dependencies.
     */
    *leftNodes(visited = new Set<string>()): Iterable<NodeView> {
        if (visited.has(this.localId)) {
            return;
        }
        visited.add(this.localId);
        yield this;
        for (const link of this.inboundLinks()) {
            yield* link.linkNode.leftNodes(visited);
        }
    }

    /**
     * Returns this node, plus all the nodes connected to its outbound sockets, recursively.
     *
     * This can also be thought of as a list of node's dependents.
     */
    *rightNodes(linkMap = this.graph.computeLinkMap(), visited = new Set<string>()): Iterable<NodeView> {
        if (visited.has(this.localId)) {
            return;
        }
        visited.add(this.localId);
        yield this;
        for (const link of linkMap.get(this.localId)) {
            yield* link.node.rightNodes(linkMap, visited);
        }
    }

    /**
     * Determines whether a link can be created from this node result socket
     * into one of the specified `node` property socket.
     * This is based solely on graph topology and disallows loops.
     */
    canLinkTo(node: NodeView) {
        for (const n of this.leftNodes()) {
            if (n.localId === node.localId) {
                return false;
            }
        }
        return true;
    }

    /**
     * Determines whether Node is evaluated manually (by pressing a Play button)
     * or immediately in the editor. Has no effect outside of the editor.
     *
     * Manually evaluated nodes cascade up and takes precedence, i.e. if a graph contains at least one
     * node with `evalMode: manual`, then its own `evalMode` is also manual.
     * Same applies to subgraphs: if a subgraph contains manually evaluated nodes,
     * then its enclosing node is also manually evaluated.
     */
    getEvalMode(): NodeEvalMode {
        if (this.metadata.forceManualEval) {
            return 'manual';
        }
        const evalMode = this.getModuleSpec().evalMode;
        if (evalMode === 'auto' && this.supportsSubgraph()) {
            // Subgraphs with manual evaluation take precedence
            return this.getSubgraph()?.getEvalMode() ?? 'auto';
        }
        return evalMode;
    }

    /**
     * Returns `true` if the node itself or any of its left nodes are async,
     * i.e. have `moduleSpec.result.async: true`.
     */
    isAsync() {
        if (this.metadata.async) {
            return true;
        }
        if (this.getModuleSpec().result.async) {
            return true;
        }
        for (const link of this.inboundLinks()) {
            if (link.linkNode.isAsync()) {
                return true;
            }
        }
        return false;
    }

    canDock() {
        return this.isParamNode() && this.getOutboundLinks().size === 1;
    }

    isDocked() {
        return this.canDock() && !!this.metadata.docked;
    }

}

export interface NodeLink {
    node: NodeView;
    linkNode: NodeView;
    prop: PropView;
    entry?: PropEntryView;
    linkKey?: string;
}
