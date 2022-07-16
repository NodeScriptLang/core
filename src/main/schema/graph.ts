import { Schema } from 'airtight';

import * as t from '../types/index.js';
import { NodeSchema } from './node.js';
import { NodeMetadataSchema } from './node-metadata.js';

export const GraphSchema = new Schema<t.Graph>({
    id: 'Graph',
    type: 'object',
    properties: {
        metadata: NodeMetadataSchema.schema,
        nodes: {
            type: 'array',
            items: NodeSchema.schema,
        },
        rootNodeId: { type: 'string' },
        refs: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'string' },
        },
    },
});
