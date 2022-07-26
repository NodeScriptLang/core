import { DataSchemaSpec } from './data.js';

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
    hideValue?: boolean;
};
