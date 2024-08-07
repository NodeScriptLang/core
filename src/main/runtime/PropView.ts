import { PropEntrySpec, PropSpec } from '../types/model.js';
import { ModuleParamSpec } from '../types/module.js';
import { SchemaSpec } from '../types/schema.js';
import { clone } from '../util/clone.js';
import { evaluateEscapes } from '../util/escape.js';
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
        const paramSpec = this.node.getModuleSpec().params[this.propKey] ?? {
            schema: { type: 'any' },
        };
        let schema = paramSpec.schema;
        if (['@system/Output', '@system/Result'].includes(this.node.ref)) {
            schema = this.graph.moduleSpec.result.schema;
        }
        this._paramSpec = {
            ...paramSpec,
            schema,
        };
    }

    toJSON() {
        return clone(this.propLine);
    }

    abstract getSchema(): SchemaSpec;
    abstract get lineUid(): string;

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
        return evaluateEscapes(this.value);
    }

    isUsingDefaultValue() {
        return this.getStaticValue() === '';
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

    get lineUid() {
        return this.node.nodeUid + ':' + this.propKey;
    }

    getSchema(): SchemaSpec {
        return this.getParamSpec().schema;
    }

    getEntries() {
        return [
            ...this.getManagedEntries(),
            ...this.getCustomEntries(),
        ];
    }

    /**
     * Managed entries appear for each property defined in parent prop's schema.
     *
     * They are special in a couple ways:
     *
     * - users can't delete them or change their key
     * - the order of managed entries is predefined
     * - they have stable ids so that they are consistently persisted
     */
    getManagedEntries(): PropEntryView[] {
        const schema = this.getSchema();
        if (schema.type !== 'object') {
            return [];
        }
        const existingEntries = (this.propSpec.entries ?? []).filter(_ => _.managed);
        const entries: PropEntryView[] = [];
        for (const key of Object.keys(schema.properties ?? {})) {
            const id = key.replace(/[^0-9a-z]/i, '_');
            const entrySpec: PropEntrySpec = existingEntries.find(_ => _.id === id) ??
                { id, key, value: '', managed: true, expand: false };
            entries.push(new PropEntryView(this, entrySpec));
        }
        return entries;
    }

    getCustomEntries(): PropEntryView[] {
        const entrySpecs = (this.propSpec.entries ?? []).filter(_ => !_.managed);
        return entrySpecs.map(_ => new PropEntryView(this, _));
    }

    isSupportsEntries() {
        const schema = this.getSchema();
        const { hideEntries } = this.getParamSpec();
        return !hideEntries && (schema.type === 'object' || schema.type === 'array');
    }

    isUsesEntries() {
        return this.isSupportsEntries() && this.isListed() && !this.isLinked();
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

    get lineUid() {
        return this.parentProp.lineUid + ':' + this.propEntrySpec.id;
    }

    isManaged() {
        return this.propEntrySpec.managed;
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
