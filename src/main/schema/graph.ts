import { Schema } from 'airtight';

import * as t from '../types/index.js';
import { IdSchema } from '../util/id.js';
import { DataSchemaSchema } from './data-schema.js';
import { NodeSchema } from './node.js';
import { ParamMetadataSchema } from './param-metadata.js';

export const GraphSchema = new Schema<t.Graph>({
    id: 'Graph',
    type: 'object',
    properties: {
        ref: IdSchema.schema,
        label: {
            type: 'string',
        },
        category: {
            type: 'array',
            items: {
                type: 'string'
            }
        },
        description: {
            type: 'string',
        },
        deprecated: {
            type: 'string',
        },
        hidden: {
            type: 'boolean',
        },
        params: {
            type: 'object',
            properties: {},
            additionalProperties: ParamMetadataSchema.schema,
        },
        returns: DataSchemaSchema.schema as any,
        compute: { type: 'any', optional: true },
        nodes: {
            type: 'array',
            items: NodeSchema.schema,
        },
        rootNodeId: { type: 'string' }
    },
});
