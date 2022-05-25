import { Schema } from 'airtight';

import * as t from '../types/index.js';

export const NodeResultSchema = new Schema<t.NodeResult>({
    type: 'object',
    properties: {
        nodeId: { type: 'string' },
        result: { type: 'any', optional: true },
        error: { type: 'any', optional: true },
    }
});
