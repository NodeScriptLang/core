import { Schema } from 'airtight';

import { FetchRequestSpec } from '../types/index.js';
import { FetchHeadersSchema } from './FetchHeaders.js';
import { FetchMethodSchema } from './FetchMethod.js';

export const FetchRequestSpecSchema = new Schema<FetchRequestSpec>({
    type: 'object',
    properties: {
        url: { type: 'string' },
        method: FetchMethodSchema.schema,
        headers: FetchHeadersSchema.schema,
        proxy: { type: 'string', optional: true },
        followRedirects: { type: 'boolean', optional: true },
        connectOptions: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        },
    },
});
