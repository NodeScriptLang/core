import { PropSpecSchema } from '../schema/index.js';
import { DataSchemaSpec, ModuleParamSpec, PropSpec } from '../types/index.js';
import { serialize } from '../util/serialize.js';
import { humanize } from '../util/string.js';
import { Node, NodeLink } from './node.js';

export type PropParent = Node | Prop;

/**
 * Represents a single property of the node.
 *
 * Objects and arrays support "entries", which are also represented by this class.
 * Entries don't support other entries, so they are not stacked infinitely.
 */
export class Prop implements PropSpec {

    id!: string;
    key!: string;
    value!: string;
    linkId!: string;
    expand!: boolean;
    entries: Prop[];

    constructor(readonly $parent: PropParent, data: Partial<PropSpec> = {}) {
        const spec = PropSpecSchema.decode(data);
        Object.assign(this, spec);
        this.entries = (spec.entries ?? []).map(spec => new Prop(this, spec));
    }

    toJSON() {
        return serialize(this, {
            value: '',
            linkId: '',
            expand: false,
            entries: [],
        });
    }

    get $node(): Node {
        return this.$parent instanceof Node ? this.$parent : this.$parent.$node;
    }

    get $graph() {
        return this.$node.$graph;
    }

    get $param(): ModuleParamSpec {
        return this.$node.$module.params[this.$paramKey] ?? {
            schema: { type: 'any' },
        };
    }

    get $paramKey() {
        // For entries the parameter key is defined by their enclosing base prop `key` field
        return this.$parent instanceof Prop ? this.$parent.key : this.key;
    }

    getLabel() {
        return this.$param.label ?? humanize(this.$paramKey);
    }

    get $baseProp(): Prop {
        return this.$parent instanceof Prop ? this.$parent : this;
    }

    isLambda() {
        return this.$param.kind === 'lambda';
    }

    isEntry() {
        return this.$parent instanceof Prop;
    }

    isSupportsEntries() {
        if (this.isEntry() || this.isLambda()) {
            return false;
        }
        const { schema, hideEntries } = this.$param;
        return !hideEntries && (schema.type === 'object' || schema.type === 'array');
    }

    isUsesEntries() {
        return this.isSupportsEntries() && !this.getLinkNode();
    }

    /*
     * Returns the node identified by its linkId.
     */
    getLinkNode(): Node | null {
        if (this.linkId) {
            return this.$graph.getNodeById(this.linkId);
        }
        return null;
    }

    /**
     * Returns all links used in actual computation.
     */
    getInboundLinks(): NodeLink[] {
        const linkNode = this.getLinkNode();
        if (linkNode) {
            return [
                {
                    node: this.$node,
                    prop: this,
                    linkNode
                }
            ];
        }
        return this.entries.flatMap(e => e.getInboundLinks());
    }

    canExpand() {
        return !this.isLambda();
    }

    isExpanded() {
        return this.canExpand() && !!this.expand && !!this.getLinkNode();
    }

    /**
     * If the prop is an entry, returns the subschema (i.e. `items` if the base prop
     * is an array or `additionalProperties` if the base prop is an object)
     */
    getTargetSchema(): DataSchemaSpec {
        const baseSchema = this.$param.schema;
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
