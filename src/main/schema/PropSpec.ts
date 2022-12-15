import { Schema } from 'airtight';

import { PropSpec } from '../types/index.js';
import { PropEntrySpecSchema } from './PropEntrySpec.js';

export const PropSpecSchema = new Schema<PropSpec>({
    id: 'PropSpec',
    type: 'object',
    properties: {
        value: { type: 'string' },
        linkId: {
            type: 'string',
            optional: true,
        },
        expand: { type: 'boolean' },
        entries: {
            type: 'array',
            optional: true,
            items: PropEntrySpecSchema.schema,
        }
    },
});
