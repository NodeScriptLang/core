import { Schema } from 'airtight';

import { NodeCacheMode } from '../types/index.js';

export const NodeCacheModeSchema = new Schema<NodeCacheMode>({
    id: 'NodeCacheMode',
    type: 'string',
    enum: ['auto', 'always', 'never'],
    default: 'auto',
});
