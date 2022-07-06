import { Schema } from 'airtight';

import * as t from '../types/index.js';
import { DataSchemaSchema } from './data-schema.js';
import { ParamMetadataSchema } from './param-metadata.js';

export const NodeMetadataSchema = new Schema<t.NodeMetadata>({
    id: 'NodeMetadata',
    type: 'object',
    properties: {
        name: {
            type: 'string',
            optional: true,
        },
        version: {
            type: 'string',
            optional: true,
        },
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
