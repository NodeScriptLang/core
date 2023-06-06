import { coerce, getDefaultValue } from 'airtight';

import { PropEntrySpec, PropSpec } from '../types/model.js';
import { ModuleParamSpec } from '../types/module.js';
import { SchemaSpec } from '../types/schema.js';
import { clone } from '../util/clone.js';
import { evaluateEscapes } from '../util/escape.js';
import { humanize } from '../util/string.js';
import { NodeView } from './NodeView.js';

export type PropLine = {
    value: string;
    linkId?: string;
    linkKey?: string;
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
        if (['@system/Output', '@system/Result'].includes(this.node.ref)) {
            this._paramSpec.schema = this.graph.moduleSpec.result.schema;
        }
    }

    toJSON() {
        return clone(this.propLine);
    }

    abstract getLineId(): string;
    abstract getSchema(): SchemaSpec;

    get graph() {
        return this.node.graph;
    }

    get value() {
        return this.propLine.value;
    }

    get linkId() {
        return this.propLine.linkId;
    }

    get linkKey() {
        return this.propLine.linkKey;
    }

    getParamSpec() {
        return this._paramSpec;
    }

    getStaticValue(): string {
        if (!this.value) {
            return this.getDefaultValue();
        }
        return evaluateEscapes(this.value);
    }

    getDefaultValue(): string {
        const str = coerce('string', getDefaultValue(this.getSchema())) ?? '';
        return evaluateEscapes(str);
    }

    isUsingDefaultValue() {
        return this.getStaticValue() === this.getDefaultValue();
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

    getSchema(): SchemaSpec {
        return this.getParamSpec().schema;
    }

    getLabel() {
        return this.getParamSpec().label ?? humanize(this.propKey);
    }

    getEntries() {
        // TODO add support for managed entries
        return (this.propSpec.entries ?? []).map(_ => new PropEntryView(this, _));
    }

    isSupportsEntries() {
        const schema = this.getSchema();
        const { hideEntries } = this.getParamSpec();
        return !hideEntries && (schema.type === 'object' || schema.type === 'array');
    }

    isUsesEntries() {
        return this.isSupportsEntries() && !this.isLinked();
    }

    hasEntries() {
        return (this.propSpec.entries?.length ?? 0) > 0;
    }

    isAdvanced() {
        return !!this.getParamSpec().advanced;
    }

    isListed() {
        if (!this.isAdvanced()) {
            return true;
        }
        // Advanced props are rendered when either:
        // - value is specified and non-default
        // - prop is linked
        // - prop key is explicitly added to node metadata
        // - prop has entries
        return !!this.node.metadata.listedProps[this.propKey] ||
            !this.isUsingDefaultValue() ||
            this.isLinked() ||
            this.hasEntries();
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

    getSchema(): SchemaSpec {
        const baseSchema = this.parentProp.getSchema();
        switch (baseSchema.type) {
            case 'array':
                return baseSchema.items ?? { type: 'any' };
            case 'object':
                return baseSchema.properties?.[this.key] ?? baseSchema.additionalProperties ?? { type: 'any' };
            default:
                return { type: 'any' };
        }
    }

}
