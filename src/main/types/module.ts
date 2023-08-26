import { SchemaSpec } from './schema.js';

export interface ModuleSpec {
    moduleName: string;
    version: string;
    labelParam: string;
    description: string;
    keywords: string[];
    deprecated?: string;
    sourceUrl?: string;
    hidden?: boolean;
    params: Record<string, ModuleParamSpec>;
    result: ModuleResultSpec;
    subgraph?: ModuleSubgraphSpec;
    newScope: boolean;
    cacheMode: NodeCacheMode;
    evalMode: NodeEvalMode;
    resizeMode: NodeResizeMode;
    hideEvalControls: boolean;
    attributes: Record<string, any>;
}

export interface ModuleParamSpec {
    schema: SchemaSpec;
    label?: string;
    deferred?: boolean;
    advanced?: boolean;
    addItemLabel?: string;
    removeItemLabel?: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    hideSocket?: boolean;
    hideEntries?: boolean;
    hideValue?: boolean;
    attributes: Record<string, any>;
    // TODO move to attributes
    minHeight?: number;
}

export interface ModuleResultSpec {
    schema: SchemaSpec;
    async?: boolean;
    hideSocket?: boolean;
}

export interface ModuleSubgraphSpec {
    input: Record<string, SchemaSpec>;
    output: SchemaSpec;
}

export type NodeEvalMode = 'auto' | 'manual';

export type NodeCacheMode = 'auto' | 'always' | 'never';

export type NodeResizeMode = 'horizontal' | 'all' | 'none';
