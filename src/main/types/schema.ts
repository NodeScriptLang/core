import { SchemaDefType } from 'airtight';

export type SchemaSpec = {
    type: SchemaDefType;
    default?: any;
    properties?: {
        [key: string]: SchemaSpec;
    };
    additionalProperties?: SchemaSpec;
    items?: SchemaSpec;
    enum?: string[];
    regex?: string;
    regexFlags?: string;
    minimum?: number;
    maximum?: number;
};
