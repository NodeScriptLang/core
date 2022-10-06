import { PropSpecSchema } from '../schema/PropSpec.js';
import { NodeSpec } from '../types/model.js';
import { GraphView } from './GraphView.js';
import { PropView } from './PropView.js';

export type NodeLink = {
    node: NodeView;
    prop: PropView;
    linkNode: NodeView;
};

export class NodeView {

    constructor(
        readonly graph: GraphView,
        readonly nodeId: string,
        readonly nodeSpec: NodeSpec,
    ) {}

    get loader() {
        return this.graph.loader;
    }

    getModuleSpec() {
        return this.loader.resolveModule(this.nodeSpec.ref);
    }

    get ref() {
        return this.nodeSpec.ref;
    }

    isRoot() {
        return this.graph.graphSpec.rootNodeId === this.nodeId;
    }

    getProps(): PropView[] {
        const props: PropView[] = [];
        for (const [paramKey, paramSpec] of Object.entries(this.getModuleSpec().params)) {
            const propSpec = this.nodeSpec.props.find(_ => _.key === paramKey) ?? PropSpecSchema.create({
                key: paramKey,
                value: paramSpec.schema.default ?? '',
            });
            const prop = new PropView(this, propSpec);
            props.push(prop);
        }
        return props;
    }

    getBasePropByKey(key: string): PropView | null {
        const propSpec = this.nodeSpec.props.find(_ => _.key === key);
        return propSpec ? new PropView(this, propSpec) : null;
    }

    getDefaultProp(): PropView | null {
        const firstProp = this.getProps()[0];
        // TODO add support to customize via ModuleSpec
        return firstProp ?? null;
    }

    /**
     * Props used in actual computation; may include base props and/or entries.
     */
    *actualProps(): Iterable<PropView> {
        for (const prop of this.getProps()) {
            if (prop.isUsesEntries()) {
                yield* prop.getEntries();
            } else {
                yield prop;
            }
        }
    }

    /**
     * Props displayed in node editor.
     * Entries are hidden if base prop has a connected socket.
     */
    *displayedProps(): Iterable<PropView> {
        for (const prop of this.getProps()) {
            if (prop.isUsesEntries()) {
                yield prop;
                yield* prop.getEntries();
            } else {
                yield prop;
            }
        }
    }

    isExpanded() {
        return [...this.actualProps()].some(_ => _.isExpanded());
    }

    getOutboundLinks(linkMap = this.graph.computeLinkMap()) {
        return linkMap.get(this.nodeId);
    }

    *leftNodes(visited: Set<string> = new Set()): Iterable<NodeView> {
        if (visited.has(this.nodeId)) {
            return;
        }
        visited.add(this.nodeId);
        yield this;
        for (const link of this.inboundLinks()) {
            yield* link.linkNode.leftNodes(visited);
        }
    }

    *rightNodes(linkMap = this.graph.computeLinkMap()): Iterable<NodeView> {
        yield this;
        for (const link of linkMap.get(this.nodeId)) {
            yield* link.node.rightNodes(linkMap);
        }
    }

    /**
     * Determines whether a link can be created from this node result socket
     * into one of the specified `node` property socket.
     * This is based solely on graph topology and disallows loops.
     */
    canLinkTo(node: NodeView) {
        for (const n of this.leftNodes()) {
            if (n.nodeId === node.nodeId) {
                return false;
            }
        }
        return true;
    }

    *inboundLinks(): Iterable<NodeLink> {
        for (const prop of this.getProps()) {
            yield* prop.getInboundLinks();
        }
    }

}
