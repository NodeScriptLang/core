import { matchPath } from '@nodescript/pathmatcher';
import { get, set } from '@nodescript/pointer';
import { getType, Schema, SchemaDef } from 'airtight';

import { RuntimeLib } from '../types/runtime-lib.js';
import { anyContains, anyEquals } from './compare.js';
import { fetchRelay } from './fetch.js';
import { parseJson } from './json.js';
import { merge } from './merge.js';
import { toRegExp } from './regexp.js';

export const runtimeLib: RuntimeLib = {
    getType,
    getSchema<T>(schema: SchemaDef<T>) {
        return new Schema(schema);
    },
    anyEquals,
    anyContains,
    get,
    set,
    merge,
    parseJson,
    toRegExp,
    matchPath,
    fetch: fetchRelay,
};
