import { Schema } from '@flexent/schema';

import { NodeResizeMode } from '../types/module.js';

export const NodeResizeModeSchema = new Schema<NodeResizeMode>({
    id: 'NodeResizeMode',
    type: 'string',
    enum: ['horizontal', 'all', 'none'],
    default: 'horizontal',
});
