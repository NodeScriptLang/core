import { DataSchemaSpec } from './data-schema.js';

export interface ModuleSpec {
    moduleId: string;
    version: string;
    label: string;
    labelParam: string;
    namespace: string;
    icon: string;
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
    schema: DataSchemaSpec;
    label?: string;
    deferred?: boolean;
    addItemLabel?: string;
    removeItemLabel?: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    hideSocket?: boolean;
    hideEntries?: boolean;
    hideValue?: boolean;
    renderer?: string;
    attributes: Record<string, any>;
    hint?: ModuleParamHint;
}

export interface ModuleResultSpec {
    schema: DataSchemaSpec;
    async?: boolean;
    hideSocket?: boolean;
}

export type NodeEvalMode = 'auto' | 'manual';

export type NodeCacheMode = 'auto' | 'always' | 'never';

export type NodeResizeMode = 'horizontal' | 'all' | 'none';

export interface ModuleParamHint {
    keyof?: string;
    pathof?: string;
}
