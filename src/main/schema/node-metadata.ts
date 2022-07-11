import { Schema } from 'airtight';

import * as t from '../types/index.js';
import { DataSchemaSchema } from './data-schema.js';
import { ParamMetadataSchema } from './param-metadata.js';

export const NodeMetadataSchema = new Schema<t.NodeMetadata>({
    id: 'NodeMetadata',
    type: 'object',
    properties: {
        channel: { type: 'string', default: 'universe' },
        name: { type: 'string' },
        version: { type: 'string', default: '1.0.0' },
        label: { type: 'string' },
        description: { type: 'string' },
        deprecated: {
            type: 'string',
            optional: true,
        },
        hidden: {
            type: 'boolean',
            optional: true,
        },
        params: {
            type: 'object',
            properties: {},
            additionalProperties: ParamMetadataSchema.schema,
        },
        result: DataSchemaSchema.schema as any,
    }
});
