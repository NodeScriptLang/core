import { DataSchemaSpec } from '../types/data-schema.js';
import { PropEntrySpec, PropSpec } from '../types/model.js';
import { ModuleParamSpec } from '../types/module.js';
import { NodeView } from './NodeView.js';

export type PropLine = {
    value: string;
    linkId?: string;
    expand: boolean;
};

export abstract class PropLineView {

    constructor(
        readonly node: NodeView,
        protected propLine: PropLine,
    ) {}

    toJSON() {
        return structuredClone(this.propLine);
    }

    abstract getLineId(): string;
    abstract getParamSpec(): ModuleParamSpec;
    abstract getSchema(): DataSchemaSpec;

    get graph() {
        return this.node.graph;
    }

    get value() {
        return this.propLine.value;
    }

    get linkId() {
        return this.propLine.linkId;
    }

    /**
     * Returns the node identified by its linkId.
     */
    getLinkNode(): NodeView | null {
        const { linkId } = this.propLine;
        return linkId ? this.graph.getNodeById(linkId) : null;
    }

    isLinked() {
        const { linkId } = this.propLine;
        return !!linkId && this.graph.isNodeExists(linkId);
    }

    isLambda() {
        return this.getParamSpec().kind === 'lambda';
    }

    canExpand() {
        return !this.isLambda();
    }

    isExpanded() {
        return this.canExpand() && this.propLine.expand && this.isLinked();
    }

}

export class PropView extends PropLineView {

    constructor(
        node: NodeView,
        readonly propKey: string,
        protected propSpec: PropSpec,
    ) {
        super(node, propSpec);
    }

    getLineId() {
        return this.node.nodeId + ':' + this.propKey;
    }

    getParamSpec(): ModuleParamSpec {
        return this.node.getModuleSpec().params[this.propKey] ?? {
            schema: { type: 'any' },
        };
    }

    getSchema(): DataSchemaSpec {
        return this.getParamSpec().schema;
    }

    getEntries() {
        return (this.propSpec.entries ?? []).map(_ => new PropEntryView(this, _));
    }

    isSupportsEntries() {
        if (this.isLambda()) {
            return false;
        }
        const { schema, hideEntries } = this.getParamSpec();
        return !hideEntries && (schema.type === 'object' || schema.type === 'array');
    }

    isUsesEntries() {
        return this.isSupportsEntries() && !this.isLinked();
    }

}

export class PropEntryView extends PropLineView {

    constructor(
        readonly parent: PropView,
        protected propEntrySpec: PropEntrySpec,
    ) {
        super(parent.node, propEntrySpec);
    }

    get key() {
        return this.propEntrySpec.key;
    }

    getLineId() {
        return this.parent.getLineId() + ':' + this.propEntrySpec.id;
    }

    getParamSpec(): ModuleParamSpec {
        return this.parent.getParamSpec();
    }

    getSchema(): DataSchemaSpec {
        const baseSchema = this.parent.getSchema();
        switch (baseSchema.type) {
            case 'array':
                return baseSchema.items ?? { type: 'any' };
            case 'object':
                return baseSchema.additionalProperties ?? { type: 'any' };
            default:
                return { type: 'any' };
        }
    }

}
