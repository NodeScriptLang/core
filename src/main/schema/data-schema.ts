import { Schema } from 'airtight';

import * as t from '../types/index.js';

export const DataSchemaSchema = new Schema<t.DataSchemaSpec>({
    id: 'DataSchema',
    type: 'object',
    properties: {
        type: {
            type: 'string',
            default: 'any',
        },
        kind: {
            type: 'string',
            optional: true,
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
                schemaId: 'DataSchema',
            },
        },
        additionalProperties: {
            type: 'ref',
            optional: true,
            schemaId: 'DataSchema',
        },
        items: {
            type: 'ref',
            optional: true,
            schemaId: 'DataSchema',
        }
    }
});
