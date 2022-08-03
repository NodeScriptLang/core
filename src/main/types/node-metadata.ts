import { DataSchemaSpec } from './data.js';
import { NodeCacheMode } from './node-cache-mode.js';
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
    cache: NodeCacheMode;
};
