import { Schema } from 'airtight';

import * as t from '../types/index.js';

export const NodeEvalModeSchema = new Schema<t.NodeEvalMode>({
    id: 'NodeEvalMode',
    type: 'string',
    enum: ['auto', 'manual'],
    default: 'auto',
});
