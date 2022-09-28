import { Schema } from '@flexent/schema';
import { customAlphabet, nanoid } from 'nanoid';

const safeAlphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

export const tinyId = () => nanoid(4);
export const shortId = () => nanoid(8);
export const mediumId = customAlphabet(safeAlphabet, 12);
export const safeId = customAlphabet(safeAlphabet, 24);

export const IdSchema = new Schema<string>({
    id: 'Id',
    type: 'string',
    regex: '^[a-zA-Z0-9_-]{1,64}$',
    default: () => safeId(),
});

/**
 * Creates a deep copy of specified object, regenerating all the id fields
 * and replacing all references to the old ids with new ones.
 * Note: ids are assumed to be strings.
 *
 * Example:
 *
 * cloneWithNewIds({ foo: 'abc', bar: { fooId: 'abc' }, baz: 'xyz' }, ['foo'])
 *
 * // { foo: 'x729agbc', bar: { fooId: 'x729agbc' }, baz: 'xyz' }
 */
export function cloneWithNewIds<T>(
    object: T,
    idFields: string[],
    generateId: () => string = shortId,
): T {
    const map = new Map<string, string>();
    const text = JSON.stringify(object, (key, value) => {
        if (idFields.includes(key)) {
            const oldId = value;
            const newId = generateId();
            map.set(oldId, newId);
            return newId;
        }
        return value;
    });
    return JSON.parse(text, (key, value) => {
        if (typeof value === 'string') {
            const newId = map.get(value);
            if (newId) {
                return newId;
            }
        }
        return value;
    });
}
