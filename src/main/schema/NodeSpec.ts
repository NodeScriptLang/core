import { Schema } from '@flexent/schema';

import { NodeSpec } from '../types/index.js';
import { PropSpecSchema } from './PropSpec.js';

export const NodeSpecSchema = new Schema<NodeSpec>({
    id: 'NodeSpec',
    type: 'object',
    properties: {
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
