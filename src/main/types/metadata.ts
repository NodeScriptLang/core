import { DataSchemaSpec } from './data.js';

export type NodeMetadata = {
    label: string;
    description: string;
    deprecated: string;
    hidden: boolean;
    params: Record<string, ParamMetadata>;
    result: DataSchemaSpec;
};

export type ParamMetadata = {
    kind?: 'lambda';
    schema: DataSchemaSpec;
    scope?: Record<string, DataSchemaSpec>;
    default?: string;
    label?: string;
    addItemLabel?: string;
    removeItemLabel?: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    hideEntries?: boolean;
};
