import { Schema } from 'airtight';

import { NodeEvalMode } from '../types/index.js';

export const NodeEvalModeSchema = new Schema<NodeEvalMode>({
    id: 'NodeEvalMode',
    type: 'string',
    enum: ['auto', 'manual'],
    default: 'auto',
});
