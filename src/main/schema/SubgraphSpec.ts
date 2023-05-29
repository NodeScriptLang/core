import { Schema } from 'airtight';

import { SubgraphSpec } from '../types/model.js';

export const SubgraphSpecSchema = new Schema<SubgraphSpec>({
    id: 'SubgraphSpec',
    type: 'object',
    properties: {
        rootNodeId: { type: 'string' },
        nodes: {
            type: 'object',
            properties: {},
            additionalProperties: {
                type: 'ref',
                schemaId: 'NodeSpec',
            },
        },
        metadata: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        },
    }
});
