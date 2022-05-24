import { Schema } from '@airtight';
import * as t from '~/types/mod.ts';

import { DataSchemaSchema } from './data-schema.ts';
import { ParamMetadataSchema } from './param-metadata.ts';

export const NodeMetadataSchema = new Schema<t.NodeMetadata>({
    type: 'object',
    properties: {
        ref: { type: 'string' },
        category: {
            type: 'array',
            items: { type: 'string' },
        },
        label: { type: 'string' },
        description: { type: 'string' },
        deprecated: { type: 'string' },
        hidden: { type: 'boolean' },
        params: {
            type: 'object',
            properties: {},
            additionalProperties: ParamMetadataSchema.schema,
        },
        returns: DataSchemaSchema.schema as any,
        compute: { type: 'any', optional: true },
    }
});
