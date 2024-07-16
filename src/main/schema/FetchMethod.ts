import { Schema } from 'airtight';

import { FetchMethod } from '../types/index.js';

export const FetchMethodSchema = new Schema<FetchMethod>({
    id: 'FetchMethod',
    type: 'string',
    enum: Object.values(FetchMethod),
});
