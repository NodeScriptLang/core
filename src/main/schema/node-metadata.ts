import { Schema } from 'airtight';

import * as t from '../types/index.js';
import { DataSchemaSchema } from './data-schema.js';
import { ParamMetadataSchema } from './param-metadata.js';

export const NodeMetadataSchema = new Schema<t.NodeMetadata>({
    id: 'NodeMetadata',
    type: 'object',
    properties: {
        label: { type: 'string' },
        category: {
            type: 'array',
            items: { type: 'string' },
        },
        description: { type: 'string' },
        deprecated: { type: 'string' },
        hidden: { type: 'boolean' },
        params: {
            type: 'object',
            properties: {},
            additionalProperties: ParamMetadataSchema.schema,
        },
        result: DataSchemaSchema.schema as any,
    }
});