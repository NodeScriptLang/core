import { Schema } from 'airtight';

import { PropSpec } from '../types/index.js';
import { IdSchema, shortId } from '../util/id.js';

export const PropSpecSchema = new Schema<PropSpec>({
    id: 'PropSpec',
    type: 'object',
    properties: {
        id: { ...IdSchema.schema, default: shortId },
        key: { type: 'string' },
        value: { type: 'string' },
        linkId: {
            type: 'string',
            optional: true,
        },
        expand: { type: 'boolean' },
        entries: {
            type: 'array',
            optional: true,
            items: {
                type: 'ref',
                schemaId: 'PropSpec',
            },
        }
    },
});
