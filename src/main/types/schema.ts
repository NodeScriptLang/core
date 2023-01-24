import { SchemaDefType } from 'airtight';

export type SchemaSpec = {
    type: SchemaDefType;
    optional?: true;
    nullable?: true;
    id?: string;
    title?: string;
    description?: string;
    default?: any;
    metadata?: any;
    properties?: {
        [key: string]: SchemaSpec;
    };
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
