import * as t from '@nodescript/core/types';
import { Schema } from 'airtight';

export const NodeEvalModeSchema = new Schema<t.NodeEvalMode>({
    id: 'NodeEvalMode',
    type: 'string',
    enum: ['auto', 'manual'],
    default: 'auto',
});
