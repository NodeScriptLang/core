import { Schema } from '@flexent/schema';
import { customAlphabet } from 'nanoid';

const safeAlphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

export const shortId = customAlphabet(safeAlphabet, 8);

export const IdSchema = new Schema<string>({
    id: 'Id',
    type: 'string',
    regex: '^[a-zA-Z0-9._-]{1,64}$',
    default: () => shortId(),
});
