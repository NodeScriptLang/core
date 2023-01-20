import { Schema } from 'airtight';

import { NodeMetadata } from '../types/model.js';
import { NodeEvalModeSchema } from './NodeEvalMode.js';
import { PointSchema } from './Point.js';

export const NodeMetadataSchema = new Schema<NodeMetadata>({
    id: 'NodeMetadada',
    type: 'object',
    properties: {
        pos: PointSchema.schema,
        w: { type: 'number', default: 5 },
        h: { type: 'number', default: 5 },
        label: { type: 'string' },
        collapsed: { type: 'boolean' },
        evalMode: {
            ...NodeEvalModeSchema.schema,
            optional: true,
        },
    },
    additionalProperties: {
        type: 'any'
    }
});
