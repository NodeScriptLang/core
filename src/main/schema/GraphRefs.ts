import { Schema } from 'airtight';

import { GraphRefs } from '../types/index.js';

export const GraphRefsSchema = new Schema<GraphRefs>({
    id: 'GraphRefs',
    type: 'object',
    properties: {},
    additionalProperties: {
        type: 'string',
    },
});
