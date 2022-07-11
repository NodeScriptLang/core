import { DataSchemaSpec } from './data.js';
import { ParamMetadata } from './param-metadata.js';

export type NodeMetadata = {
    channel: string;
    name: string;
    version: string;
    tags: string[];
    label: string;
    description: string;
    deprecated?: string;
    hidden?: boolean;
    params: Record<string, ParamMetadata>;
    result: DataSchemaSpec;
};
