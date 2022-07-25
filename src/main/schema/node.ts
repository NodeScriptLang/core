import { Schema } from 'airtight';

import * as t from '../types/index.js';
import { IdSchema, shortId } from '../util/id.js';
import { PropSchema } from './prop.js';

export const NodeSchema = new Schema<t.Node>({
    id: 'Node',
    type: 'object',
    properties: {
        id: { ...IdSchema.schema, default: () => shortId() },
        ref: { type: 'string' },
        props: {
            type: 'array',
            items: PropSchema.schema,
        },
        aux: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        }
    }
});
