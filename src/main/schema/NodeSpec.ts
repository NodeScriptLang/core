import { Schema } from '@flexent/schema';

import { NodeSpec } from '../types/index.js';
import { PropSpecSchema } from './PropSpec.js';

export const NodeSpecSchema = new Schema<NodeSpec>({
    id: 'NodeSpec',
    type: 'object',
    properties: {
        ref: { type: 'string' },
        label: { type: 'string' },
        props: {
            type: 'object',
            properties: {},
            additionalProperties: PropSpecSchema.schema,
        },
        metadata: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        }
    }
});
