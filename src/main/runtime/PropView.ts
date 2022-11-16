import { DataSchemaSpec } from '../types/data-schema.js';
import { PropEntrySpec, PropSpec } from '../types/model.js';
import { ModuleParamSpec } from '../types/module.js';
import { clone } from '../util/clone.js';
import { humanize } from '../util/string.js';
import { NodeView } from './NodeView.js';

export type PropLine = {
    value: string;
    linkId?: string;
    expand: boolean;
};

export abstract class PropLineView {

    private _paramSpec: ModuleParamSpec;

    constructor(
        readonly node: NodeView,
        readonly propKey: string,
        protected propLine: PropLine,
    ) {
        this._paramSpec = this.node.getModuleSpec().params[this.propKey] ?? {
            schema: { type: 'any' },
        };
    }

    toJSON() {
        return clone(this.propLine);
    }

    abstract getLineId(): string;
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

    getParamSpec() {
        return this._paramSpec;
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

    canExpand() {
        return true;
    }

    isExpanded() {
        return this.canExpand() && this.propLine.expand && this.isLinked();
    }

    isDeferred() {
        return this.getParamSpec().deferred && this.isLinked() && !this.propLine.expand;
    }

}

export class PropView extends PropLineView {

    constructor(
        node: NodeView,
        propKey: string,
        protected propSpec: PropSpec,
    ) {
        super(node, propKey, propSpec);
    }

    getLineId() {
        return this.node.nodeId + ':' + this.propKey;
    }

    getSchema(): DataSchemaSpec {
        return this.getParamSpec().schema;
    }

    getLabel() {
        return this.getParamSpec().label ?? humanize(this.propKey);
    }

    getEntries() {
        return (this.propSpec.entries ?? []).map(_ => new PropEntryView(this, _));
    }

    isSupportsEntries() {
        const { schema, hideEntries } = this.getParamSpec();
        return !hideEntries && (schema.type === 'object' || schema.type === 'array');
    }

    isUsesEntries() {
        return this.isSupportsEntries() && !this.isLinked();
    }

}

export class PropEntryView extends PropLineView {

    constructor(
        readonly parentProp: PropView,
        protected propEntrySpec: PropEntrySpec,
    ) {
        super(parentProp.node, parentProp.propKey, propEntrySpec);
    }

    get id() {
        return this.propEntrySpec.id;
    }

    get key() {
        return this.propEntrySpec.key;
    }

    getLineId() {
        return this.parentProp.getLineId() + ':' + this.propEntrySpec.id;
    }

    getSchema(): DataSchemaSpec {
        const baseSchema = this.parentProp.getSchema();
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
