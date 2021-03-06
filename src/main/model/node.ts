import { NodeSchema } from '../schema/node.js';
import * as t from '../types/index.js';
import { serialize } from '../util/serialize.js';
import { Graph } from './graph.js';
import { Prop } from './prop.js';

export type NodeLink = {
    node: Node;
    prop: Prop;
    linkNode: Node;
    linkKey: string;
};

/**
 * Represents a single node instance in a graph.
 */
export class Node implements t.Node {

    static schema = NodeSchema;

    id!: string;
    ref!: string;
    aux: Record<string, any> = {};

    props: Prop[] = [];

    constructor(readonly $graph: Graph, spec: t.NodeSpec = {}) {
        const node = Node.schema.decode(spec);
        Object.assign(this, node);
        this.props = this.initProps(node.props);
    }

    toJSON() {
        return serialize(this, {});
    }

    get $uri() {
        return this.$graph.resolveUri(this.ref);
    }

    get $def() {
        return this.$graph.resolveNode(this.ref);
    }

    /**
     * Determines whether this node is a root node of the graph.
     */
    isRoot() {
        return this.$graph.rootNodeId === this.id;
    }

    /**
     * Returns top prop with matching `key`.
     */
    getBasePropByKey(key: string): Prop | null {
        return this.props.find(_ => _.key === key) ?? null;
    }

    /**
     * Returns either a base prop or an entry with specified `id`.
     */
    getPropById(id: string): Prop | null {
        for (const entry of this.allProps()) {
            if (entry.id === id) {
                return entry;
            }
        }
        return null;
    }

    /**
     * Returns all node props, i.e. base props and their entries.
     */
    *allProps() {
        for (const prop of this.props) {
            yield prop;
            if (prop.isSupportsEntries()) {
                yield* prop.entries;
            }
        }
    }

    /**
     * Props used in actual computation; may include base props and/or entries.
     */
    *computedProps(): Iterable<Prop> {
        for (const prop of this.props) {
            if (prop.isUsesEntries()) {
                yield* prop.entries;
            } else {
                yield prop;
            }
        }
    }

    /**
     * Props displayed in node editor.
     * Entries are hidden if base prop has a connected socket.
     */
    *displayedProps(): Iterable<Prop> {
        for (const prop of this.props) {
            if (prop.isUsesEntries()) {
                yield prop;
                yield* prop.entries;
            } else {
                yield prop;
            }
        }
    }

    isExpanded() {
        return [...this.computedProps()].some(_ => _.isExpanded());
    }

    *leftNodes(visited: Set<string> = new Set()): Iterable<Node> {
        if (visited.has(this.id)) {
            return;
        }
        visited.add(this.id);
        yield this;
        for (const link of this.inboundLinks()) {
            yield* link.linkNode.leftNodes(visited);
        }
    }

    *rightNodes(linkMap = this.$graph.computeLinkMap()): Iterable<Node> {
        yield this;
        for (const link of linkMap.get(this.id)) {
            yield* link.node.rightNodes(linkMap);
        }
    }

    /**
     * Determines whether a link can be created from this node result socket
     * into one of the specified `node` property socket.
     * This is based solely on graph topology and disallows loops.
     */
    canLinkTo(node: Node) {
        for (const n of this.leftNodes()) {
            if (n.id === node.id) {
                return false;
            }
        }
        return true;
    }

    *inboundLinks(): Iterable<NodeLink> {
        for (const prop of this.allProps()) {
            const linkNode = prop.getLinkNode();
            if (linkNode) {
                yield {
                    node: this,
                    prop,
                    linkNode,
                    linkKey: prop.linkKey,
                };
            }
        }
    }

    setPropKey(propId: string, newKey: string) {
        const prop = this.getPropById(propId);
        if (prop && prop.isEntry()) {
            prop.key = newKey;
        }
    }

    setPropValue(propId: string, newValue: string) {
        const prop = this.getPropById(propId);
        if (prop) {
            prop.value = newValue;
        }
    }

    setPropExpand(propId: string, expand: boolean) {
        const prop = this.getPropById(propId);
        if (prop) {
            prop.expand = expand;
        }
    }

    addPropEntry(key: string) {
        const baseProp = this.getBasePropByKey(key);
        if (baseProp && baseProp.isSupportsEntries()) {
            const entry = new Prop(baseProp);
            baseProp.entries.push(entry);
        }
    }

    removePropEntry(key: string, entryId: string) {
        const baseProp = this.getBasePropByKey(key);
        if (baseProp && baseProp.isSupportsEntries()) {
            const i = baseProp.entries.findIndex(_ => _.id === entryId);
            if (i > -1) {
                baseProp.entries.splice(i, 1);
            }
        }
    }

    protected initProps(specs: t.Prop[]) {
        const props: Prop[] = [];
        for (const [key, param] of Object.entries(this.$def.metadata.params)) {
            const spec = specs.find(_ => _.key === key) ?? {
                key,
                value: param.schema.default ?? '',
            };
            const prop = new Prop(this, spec);
            props.push(prop);
        }
        return props;
    }

    applyInvariants() {
        // Loops are not allowed between the nodes
        for (const prop of this.props) {
            const linkNode = prop.getLinkNode();
            if (linkNode) {
                if (!linkNode.canLinkTo(this)) {
                    prop.linkId = '';
                }
            }
        }
    }

}
