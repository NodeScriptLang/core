import { SchemaSpec } from './schema.js';

export interface ModuleSpec {
    moduleName: string;
    version: string;
    labelParam: string;
    description: string;
    keywords: string[];
    deprecated?: string;
    sourceUrl?: string;
    params: Record<string, ModuleParamSpec>;
    result: ModuleResultSpec;
    subgraph?: ModuleSubgraphSpec;
    newScope: boolean;
    cacheMode: NodeCacheMode;
    evalMode: NodeEvalMode;
    attributes: Record<string, any>;
}

export interface ModuleParamSpec {
    schema: SchemaSpec;
    deferred?: boolean;
    advanced?: boolean;
    hideSocket?: boolean;
    hideEntries?: boolean;
    hideValue?: boolean;
    attributes: Record<string, any>;
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
