import { Schema } from 'airtight';

import * as t from '../types/index.js';

export const NodeResizeModeSchema = new Schema<t.NodeResizeMode>({
    id: 'NodeResizeMode',
    type: 'string',
    enum: ['horizontal', 'all', 'none'],
    default: 'horizontal',
});
