import { Schema } from 'airtight';

import { FetchHeaders } from '../types/index.js';

export const FetchHeadersSchema = new Schema<FetchHeaders>({
    id: 'FetchHeaders',
    type: 'object',
    properties: {},
    additionalProperties: { type: 'any' },
});
