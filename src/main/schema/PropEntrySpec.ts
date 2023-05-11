import { Schema } from 'airtight';

import { PropEntrySpec } from '../types/index.js';
import { IdSchema } from '../util/id.js';

export const PropEntrySpecSchema = new Schema<PropEntrySpec>({
    id: 'PropSpec',
    type: 'object',
    properties: {
        id: IdSchema.schema,
        key: { type: 'string' },
        value: { type: 'string' },
        linkId: {
            type: 'string',
            optional: true,
        },
        expand: { type: 'boolean' },
    },
});
