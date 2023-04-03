import { Schema } from 'airtight';

import { NodeResult } from '../types/node-result.js';

export const NodeResultSchema = new Schema<NodeResult>({
    id: 'NodeResult',
    type: 'object',
    properties: {
        nodeId: { type: 'string' },
        result: { type: 'any', optional: true },
        error: { type: 'any', optional: true },
        progress: { type: 'number', optional: true },
        timestamp: { type: 'number', optional: true },
    }
});
