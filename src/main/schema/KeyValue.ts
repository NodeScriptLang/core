import { Schema } from 'airtight';

export interface KeyValue {
    key: string;
    value: any;
}

export const KeyValueSchema = new Schema<KeyValue>({
    type: 'object',
    properties: {
        key: { type: 'string' },
        value: { type: 'any' },
    },
});
