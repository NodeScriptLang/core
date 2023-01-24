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
        optional: {
            type: 'boolean',
            optional: true,
        },
        nullable: {
            type: 'boolean',
            optional: true,
        },
        id: {
            type: 'string',
            optional: true,
        },
        title: {
            type: 'string',
            optional: true,
        },
        description: {
            type: 'string',
            optional: true,
        },
        default: {
            type: 'any',
            optional: true,
        },
        metadata: {
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
        refs: {
            type: 'array',
            optional: true,
            items: {
                type: 'ref',
                schemaId: 'SchemaSpec',
            }
        },
        schemaId: {
            type: 'string',
            optional: true,
        },
        enum: {
            type: 'array',
            items: { type: 'string' },
            optional: true,
        },
        regex: {
            type: 'string',
            optional: true,
        },
        regexFlags: {
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
