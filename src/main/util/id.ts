import { Schema } from '@nodescript/schema';
import { customAlphabet } from 'nanoid';

export const shortId = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
export const standardId = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 16);

export const IdSchema = new Schema<string>({
    id: 'Id',
    type: 'string',
    regex: '^[a-zA-Z0-9._-]{1,64}$',
    default: () => shortId(),
});
