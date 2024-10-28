import { Schema } from 'airtight';

import { NodeMetadata } from '../types/model.js';
import { PointSchema } from './Point.js';

export const NodeMetadataSchema = new Schema<NodeMetadata>({
    id: 'NodeMetadada',
    type: 'object',
    properties: {
        pos: PointSchema.schema,
        w: { type: 'number', default: 5 },
        h: { type: 'number', default: 5 },
        label: { type: 'string', default: '' },
        collapsed: { type: 'boolean', default: false },
        docked: { type: 'boolean', default: false },
        listedProps: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'boolean' },
            default: {},
        }
    },
    additionalProperties: {
        type: 'any'
    },
});
