import { Schema } from 'airtight';

import { HttpDict, HttpDictSchema } from './HttpDict.js';

export interface ResponseSpec {
    status: number;
    headers: HttpDict;
    body: any;
    attributes?: Record<string, string>;
}

export const ResponseSpecSchema = new Schema<ResponseSpec>({
    id: 'ResponseSpec',
    type: 'object',
    properties: {
        status: { type: 'number' },
        headers: HttpDictSchema.schema,
        body: { type: 'any' },
        attributes: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'string' },
            optional: true,
        }
    },
});
