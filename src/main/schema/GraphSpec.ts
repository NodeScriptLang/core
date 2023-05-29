import { Schema } from 'airtight';

import { GraphSpec } from '../types/model.js';
import { ModuleSpecSchema } from './ModuleSpec.js';
import { NodeSpecSchema } from './NodeSpec.js';

export const GraphSpecSchema = new Schema<GraphSpec>({
    id: 'GraphSpec',
    type: 'object',
    properties: {
        moduleSpec: ModuleSpecSchema.schema,
        rootNodeId: { type: 'string' },
        nodes: {
            type: 'object',
            properties: {},
            additionalProperties: NodeSpecSchema.schema,
        },
        metadata: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        },
    }
});
