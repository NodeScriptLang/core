import { DataSchemaSpec } from './data-schema.js';

export interface ModuleSpec {
    label: string;
    labelParam: string;
    description: string;
    keywords: string;
    async: boolean;
    deprecated?: string;
    params: Record<string, ModuleParamSpec>;
    result: ModuleResultSpec;
    cacheMode: NodeCacheMode;
    evalMode: NodeEvalMode;
    resizeMode: NodeResizeMode;
    computeUrl?: string;
    bundleUrl?: string;
    sourceUrl?: string;
    exampleUrl?: string;
}

export interface ModuleParamSpec {
    kind?: 'lambda';
    schema: DataSchemaSpec;
    scope?: Record<string, DataSchemaSpec>;
    default: string;
    label?: string;
    addItemLabel: string;
    removeItemLabel: string;
    keyPlaceholder: string;
    valuePlaceholder: string;
    hideSocket: boolean;
    hideEntries: boolean;
    hideValue: boolean;
    renderer?: string;
}

export interface ModuleResultSpec {
    schema: DataSchemaSpec;
    hideSocket: boolean;
}

export type NodeEvalMode = 'auto' | 'manual';

export type NodeCacheMode = 'auto' | 'always' | 'never';

export type NodeResizeMode = 'horizontal' | 'all' | 'none';
