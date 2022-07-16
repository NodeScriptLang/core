import { Schema } from 'airtight';

import * as t from '../types/index.js';
import { DataSchemaSchema } from './data-schema.js';
import { ParamMetadataSchema } from './param-metadata.js';
import { VersionSchema } from './version.js';

export const NodeMetadataSchema = new Schema<t.NodeMetadata>({
    id: 'NodeMetadata',
    type: 'object',
    properties: {
        channel: { type: 'string', default: 'sandbox' },
        name: { type: 'string' },
        version: VersionSchema.schema,
        tags: {
            type: 'array',
            items: { type: 'string' },
        },
        label: { type: 'string' },
        description: { type: 'string' },
        keywords: {
            type: 'array',
            items: { type: 'string' },
        },
        deprecated: {
            type: 'string',
            optional: true,
        },
        async: {
            type: 'boolean',
            optional: true
        },
        params: {
            type: 'object',
            properties: {},
            additionalProperties: ParamMetadataSchema.schema,
        },
        result: DataSchemaSchema.schema as any,
        hidden: {
            type: 'boolean',
            optional: true,
        },
        hideOutboundSocket: {
            type: 'boolean',
            optional: true,
        },
        aux: {
            type: 'object',
            properties: {},
            additionalProperties: {
                type: 'any',
            },
            optional: true,
        }
    }
});
