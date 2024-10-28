import { SchemaDefType } from 'airtight';

export type SchemaSpec = {
    type: SchemaDefType;
    optional?: boolean;
    nullable?: boolean;
    id?: string;
    title?: string;
    description?: string;
    default?: string;
    metadata?: any;
    properties?: Record<string, SchemaSpec>;
    additionalProperties?: SchemaSpec;
    items?: SchemaSpec;
    refs?: SchemaSpec[];
    schemaId?: string;
    enum?: string[];
    regex?: string;
    regexFlags?: string;
    minimum?: number;
    maximum?: number;
};
