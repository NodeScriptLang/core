import { coerce } from 'airtight';

import { ModuleSpecSchema } from '../schema/ModuleSpec.js';
import { PropSpecSchema } from '../schema/PropSpec.js';
import { NodeSpec } from '../types/model.js';
import { ModuleSpec } from '../types/module.js';
import { clone } from '../util/clone.js';
import { GraphView } from './GraphView.js';
import { PropEntryView, PropLineView, PropView } from './PropView.js';
import { createSubgraphModuleSpec } from '../util/graph.js';

export type NodeLink = {
    node: NodeView;
    linkNode: NodeView;
    prop: PropView;
    entry?: PropEntryView;
    linkKey?: string;
};

export class NodeView {

    private _moduleSpec: ModuleSpec;

    constructor(
        readonly graph: GraphView,
        readonly nodeId: string,
        protected nodeSpec: NodeSpec,
    ) {
        this._moduleSpec = this.loader.resolveModule(this.nodeSpec.ref);
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

    getModuleSpec() {
        return this._moduleSpec;
    }

    isRoot() {
        return this.graph.rootNodeId === this.nodeId;
    }

    getSubgraph(): GraphView | null {
        const { subgraph } = this.getModuleSpec();
        if (!subgraph) {
            return null;
        }
        const scopeId = [this.graph.scopeId, this.nodeId].join('/');
        const { nodes = {}, rootNodeId = '', metadata = {} } = this.nodeSpec.subgraph ?? {};
        const moduleSpec = createSubgraphModuleSpec(subgraph);
        return new GraphView(this.loader, {
            moduleSpec,
            nodes,
            rootNodeId,
            metadata,
        }, scopeId);
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
        const propSpec = this.nodeSpec.props[key] ?? PropSpecSchema.create({
            value: coerce('string', paramSpec.schema.default) ?? '',
        });
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
        for (const line of this.allLines()) {
            if (line.isExpanded()) {
                yield line;
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

    getEvalMode() {
        return this.getModuleSpec().evalMode;
    }

    isAsync() {
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

}
