import { Schema } from '@flexent/schema';

import { NodeSpec } from '../types/index.js';
import { IdSchema, shortId } from '../util/id.js';
import { PropSpecSchema } from './PropSpec.js';

export const NodeSpecSchema = new Schema<NodeSpec>({
    id: 'NodeSpec',
    type: 'object',
    properties: {
        id: { ...IdSchema.schema, default: () => shortId() },
        ref: { type: 'string' },
        props: {
            type: 'array',
            items: PropSpecSchema.schema,
        },
        metadata: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        }
    }
});
