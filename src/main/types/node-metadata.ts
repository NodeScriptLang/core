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
    hidden?: boolean;
    params: Record<string, ParamMetadata>;
    result: DataSchemaSpec;
    async?: boolean;
};
