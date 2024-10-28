import { Schema } from 'airtight';

export type HttpDict = Record<string, string[]>;

export const HttpDictSchema = new Schema<HttpDict>({
    id: 'HttpDict',
    type: 'object',
    properties: {},
    additionalProperties: {
        type: 'array',
        items: {
            type: 'string',
        }
    }
});
