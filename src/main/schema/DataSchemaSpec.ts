import { Schema } from 'airtight';

import { SchemaSpec } from '../types/schema.js';

export const SchemaSpecSchema = new Schema<SchemaSpec>({
    id: 'SchemaSpec',
    type: 'object',
    properties: {
        type: {
            type: 'string',
            default: 'any',
        },
        default: {
            type: 'any',
            optional: true,
        },
        properties: {
            type: 'object',
            optional: true,
            properties: {},
            additionalProperties: {
                type: 'ref',
                schemaId: 'SchemaSpec',
            },
        },
        additionalProperties: {
            type: 'ref',
            optional: true,
            schemaId: 'SchemaSpec',
        },
        items: {
            type: 'ref',
            optional: true,
            schemaId: 'SchemaSpec',
        },
        enum: {
            type: 'array',
            items: { type: 'string' },
            optional: true,
        },
        regexp: {
            type: 'string',
            optional: true,
        },
        regexpFlags: {
            type: 'string',
            optional: true,
        },
        minimum: {
            type: 'number',
            optional: true,
        },
        maximum: {
            type: 'number',
            optional: true,
        },
    }
});
