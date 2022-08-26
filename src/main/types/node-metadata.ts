import { DataSchemaSpec } from './data.js';
import { ParamMetadata } from './param-metadata.js';

export type NodeMetadata = {
    channel: string;
    name: string;
    version: string;
    tags: string[];
    label: string;
    description: string;
    keywords: string[];
    deprecated?: string;
    async?: boolean;
    params: Record<string, ParamMetadata>;
    result: DataSchemaSpec;
    hidden?: boolean;
    hideOutboundSocket?: boolean;
    labelParam?: string;
    cacheMode: NodeCacheMode;
    evalMode: NodeEvalMode;
    resizeMode: NodeResizeMode;
};

export type NodeEvalMode = 'auto' | 'manual';

export type NodeCacheMode = 'auto' | 'always' | 'never';

export type NodeResizeMode = 'horizontal' | 'all' | 'none';
