import { Schema } from 'airtight';

import * as t from '../types/index.js';

export const NodeCacheModeSchema = new Schema<t.NodeCacheMode>({
    id: 'NodeCacheMode',
    type: 'string',
    enum: ['auto', 'always', 'never'],
    default: 'auto',
});
