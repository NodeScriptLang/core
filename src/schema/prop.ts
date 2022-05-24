import { Schema } from 'airtight';
import { IdSchema, shortId } from '../util/id.js';
import * as t from '../types/index.js';

export const PropSchema = new Schema<t.Prop>({
    id: 'Prop',
    type: 'object',
    properties: {
        id: { ...IdSchema.schema, default: shortId },
        key: { type: 'string' },
        value: { type: 'string' },
        linkId: { type: 'string' },
        linkKey: { type: 'string' },
        expand: { type: 'boolean' },
        entries: {
            type: 'array',
            optional: true,
            items: {
                type: 'ref',
                schemaId: 'Prop',
            },
        }
    },
});
