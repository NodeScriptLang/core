import { DataType, SchemaDef, SchemaLike } from 'airtight';

export interface ComparisonOptions {
    strict?: boolean;
    collapseWhitespace?: boolean;
    onlyAlphaNumeric?: boolean;
    caseSensitive?: boolean;
    trim?: boolean;
}

export interface RuntimeLib {
    getType(value: unknown): DataType;
    getSchema<T>(spec: SchemaDef<T>): SchemaLike<T>;

    anyEquals(a: unknown, b: unknown, options?: ComparisonOptions): boolean;
    anyContains(haystack: any, needle: any, options: ComparisonOptions): boolean;

    get(object: unknown, keyish: string): unknown;
    set(object: unknown, keyish: string, value: unknown): void;
    merge(a: unknown, b: unknown): unknown;

    parseJson(str: string, defaultValue?: any): unknown;
    toRegExp(value: unknown): RegExp;
}