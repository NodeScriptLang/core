import { DataSchemaSpec } from './data-schema.js';

export interface ModuleSpec {
    moduleId: string;
    version: string;
    label: string;
    labelParam: string;
    description: string;
    keywords: string[];
    deprecated?: string;
    hidden?: boolean;
    params: Record<string, ModuleParamSpec>;
    result: ModuleResultSpec;
    cacheMode: NodeCacheMode;
    evalMode: NodeEvalMode;
    resizeMode: NodeResizeMode;
    attributes: Record<string, any>;
}

export interface ModuleParamSpec {
    kind?: 'lambda';
    schema: DataSchemaSpec;
    scope?: Record<string, DataSchemaSpec>;
    default?: string;
    label?: string;
    addItemLabel?: string;
    removeItemLabel?: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    hideSocket?: boolean;
    hideEntries?: boolean;
    hideValue?: boolean;
    renderer?: string;
}

export interface ModuleResultSpec {
    schema: DataSchemaSpec;
    async?: boolean;
    hideSocket?: boolean;
}

export type NodeEvalMode = 'auto' | 'manual';

export type NodeCacheMode = 'auto' | 'always' | 'never';

export type NodeResizeMode = 'horizontal' | 'all' | 'none';
