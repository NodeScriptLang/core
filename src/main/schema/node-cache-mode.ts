import * as t from '@nodescript/core/types';
import { Schema } from 'airtight';

export const NodeCacheModeSchema = new Schema<t.NodeCacheMode>({
    id: 'NodeCacheMode',
    type: 'string',
    enum: ['auto', 'always', 'never'],
    default: 'auto',
});
