import { DataSchemaSpec } from '../types/data-schema.js';
import { PropSpec } from '../types/model.js';
import { ModuleParamSpec } from '../types/module.js';
import { NodeLink, NodeView } from './NodeView.js';

export type PropParentView = NodeView | PropView;

export class PropView {

    constructor(
        readonly parent: PropParentView,
        readonly propSpec: PropSpec,
    ) {}

    get node(): NodeView {
        return this.parent instanceof NodeView ? this.parent : this.parent.node;
    }

    get graph() {
        return this.node.graph;
    }

    getParamKey() {
        // For entries the parameter key is defined by their enclosing base prop `key` field
        return this.parent instanceof PropView ? this.parent.propSpec.key : this.propSpec.key;
    }

    getParamSpec(): ModuleParamSpec {
        return this.node.getModuleSpec().params[this.getParamKey()] ?? {
            schema: { type: 'any' },
        };
    }

    getBaseProp(): PropView {
        return this.parent instanceof PropView ? this.parent : this;
    }

    getEntries(): PropView[] {
        if (this.isSupportsEntries()) {
            return (this.propSpec.entries ?? []).map(_ => new PropView(this, _));
        }
        return [];
    }

    isLambda() {
        return this.getParamSpec().kind === 'lambda';
    }

    isEntry() {
        return this.parent instanceof PropView;
    }

    isSupportsEntries() {
        if (this.isEntry() || this.isLambda()) {
            return false;
        }
        const { schema, hideEntries } = this.getParamSpec();
        return !hideEntries && (schema.type === 'object' || schema.type === 'array');
    }

    isUsesEntries() {
        return this.isSupportsEntries() && !this.getLinkNode();
    }

    /*
     * Returns the node identified by its linkId.
     */
    getLinkNode(): NodeView | null {
        if (this.propSpec.linkId) {
            return this.graph.getNodeById(this.propSpec.linkId);
        }
        return null;
    }

    /**
     * Returns all links used in actual computation.
     */
    getInboundLinks(): NodeLink[] {
        const node = this.node;
        const linkNode = this.getLinkNode();
        if (linkNode && linkNode.canLinkTo(node)) {
            return [
                {
                    node,
                    prop: this,
                    linkNode,
                }
            ];
        }
        return this.getEntries().flatMap(e => e.getInboundLinks());
    }

    canExpand() {
        return !this.isLambda();
    }

    isExpanded() {
        return this.canExpand() && !!this.propSpec.expand && !!this.getLinkNode();
    }

    /**
     * If the prop is an entry, returns the subschema (i.e. `items` if the base prop
     * is an array or `additionalProperties` if the base prop is an object)
     */
    getTargetSchema(): DataSchemaSpec {
        const baseSchema = this.getParamSpec().schema;
        if (this.isEntry()) {
            if (baseSchema.type === 'array') {
                return baseSchema.items ?? { type: 'any' };
            }
            if (baseSchema.type === 'object') {
                return baseSchema.additionalProperties ?? { type: 'any' };
            }
        }
        return baseSchema;
    }

}
