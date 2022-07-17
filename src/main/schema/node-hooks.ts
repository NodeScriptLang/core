import { Schema } from 'airtight';

import * as t from '../types/index.js';

export const NodeHooksSchema = new Schema<t.NodeHooks>({
    id: 'NodeHooks',
    type: 'object',
    properties: {
        mount: { type: 'any', optional: true },
        unmount: { type: 'any', optional: true },
        update: { type: 'any', optional: true },
    },
});
