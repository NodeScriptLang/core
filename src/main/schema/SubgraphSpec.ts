import { Schema } from 'airtight';

import { SubgraphSpec } from '../types/model.js';
import { NodeSpecSchema } from './NodeSpec.js';

export const SubgraphSpecSchema = new Schema<SubgraphSpec>({
    id: 'SubgraphSpec',
    type: 'object',
    properties: {
        rootNodeId: { type: 'string' },
        nodes: {
            type: 'object',
            properties: {},
            additionalProperties: NodeSpecSchema.schema,
        },
    }
});
