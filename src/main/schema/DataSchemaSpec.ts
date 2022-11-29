import { Schema } from '@nodescript/schema';

import { DataSchemaSpec } from '../types/data-schema.js';

export const DataSchemaSpecSchema = new Schema<DataSchemaSpec>({
    id: 'DataSchemaSpec',
    type: 'object',
    properties: {
        type: {
            type: 'string',
            default: 'any',
        },
        enum: {
            type: 'array',
            items: { type: 'string' },
            optional: true,
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
                schemaId: 'DataSchemaSpec',
            },
        },
        additionalProperties: {
            type: 'ref',
            optional: true,
            schemaId: 'DataSchemaSpec',
        },
        items: {
            type: 'ref',
            optional: true,
            schemaId: 'DataSchemaSpec',
        }
    }
});
