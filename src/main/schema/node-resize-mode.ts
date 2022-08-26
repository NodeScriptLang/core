import * as t from '@nodescript/core/types';
import { Schema } from 'airtight';

export const NodeResizeModeSchema = new Schema<t.NodeResizeMode>({
    id: 'NodeResizeMode',
    type: 'string',
    enum: ['horizontal', 'all', 'none'],
    default: 'horizontal',
});
