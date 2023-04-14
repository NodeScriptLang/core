import { Schema } from 'airtight';

import { HttpDict, HttpDictSchema } from './HttpDict.js';
import { RequestMethod, RequestMethodSchema } from './RequestMethod.js';

export interface RequestSpec {
    method: RequestMethod;
    path: string;
    query: HttpDict;
    headers: HttpDict;
    body: any;
}

export const RequestSpecSchema = new Schema<RequestSpec>({
    id: 'RequestSpec',
    type: 'object',
    properties: {
        method: RequestMethodSchema.schema,
        path: { type: 'string' },
        query: HttpDictSchema.schema,
        headers: HttpDictSchema.schema,
        body: { type: 'any' },
    },
});
