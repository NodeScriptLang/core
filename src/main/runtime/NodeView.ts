import { PropSpecSchema } from '../schema/PropSpec.js';
import { NodeSpec } from '../types/model.js';
import { ModuleSpec } from '../types/module.js';
import { GraphView } from './GraphView.js';
import { PropEntryView, PropLineView, PropView } from './PropView.js';

export type NodeLink = {
    node: NodeView;
    linkNode: NodeView;
    prop: PropView;
    entry?: PropEntryView;
};

export class NodeView {

    private _ref: string = '';
    private _moduleSpec: ModuleSpec | null = null;

    constructor(
        readonly graph: GraphView,
        readonly nodeId: string,
        readonly nodeSpec: NodeSpec,
    ) {}

    get loader() {
        return this.graph.loader;
    }

    getModuleSpec() {
        if (!this._moduleSpec || this._ref !== this.nodeSpec.ref) {
            this._moduleSpec = this.loader.resolveModule(this.nodeSpec.ref);
            this._ref = this.nodeSpec.ref;
            return this._moduleSpec;
        }
        return this._moduleSpec;
    }

    get ref() {
        return this.nodeSpec.ref;
    }

    isRoot() {
        return this.graph.graphSpec.rootNodeId === this.nodeId;
    }

    getProps(): PropView[] {
        const props: PropView[] = [];
        for (const [propKey, paramSpec] of Object.entries(this.getModuleSpec().params)) {
            const propSpec = this.nodeSpec.props[propKey] ?? PropSpecSchema.create({
                value: paramSpec.schema.default ?? '',
            });
            const prop = new PropView(this, propKey, propSpec);
            props.push(prop);
        }
        return props;
    }

    getProp(key: string): PropView | null {
        const propSpec = this.nodeSpec.props[key];
        return propSpec ? new PropView(this, key, propSpec) : null;
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

    *expandedLines(): Iterable<PropLineView> {
        for (const prop of this.getProps()) {
            if (prop.isUsesEntries()) {
                for (const entry of prop.getEntries()) {
                    if (entry.isExpanded()) {
                        yield entry;
                    }
                }
            } else if (prop.isExpanded()) {
                yield prop;
            }
        }
    }

    getOutboundLinks(linkMap = this.graph.computeLinkMap()) {
        return linkMap.get(this.nodeId);
    }

    *inboundLinks(): Iterable<NodeLink> {
        for (const prop of this.getProps()) {
            const linkNode = prop.getLinkNode();
            if (linkNode) {
                yield {
                    node: this,
                    linkNode,
                    prop,
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
                        };
                    }
                }
            }
        }
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

}
