export type DataType = 'string' | 'boolean' | 'number' | 'object' | 'array' | 'any' | 'null';

export type DataSchema<T = unknown> =
    unknown extends T ? UnknownDataSchema :
    T extends string ? StringDataSchema :
    T extends number ? NumberDataSchema :
    T extends boolean ? BooleanDataSchema :
    T extends Record<string, infer M> ? ObjectDataSchema<T, M>:
    T extends Array<infer M> ? ArrayDataSchema<M> :
    AnyDataSchema;

export type DataSchemaType = DataSchema['type'];

export type DataSchemaSpec = {
    type: DataSchemaType;
    kind?: string;
    enum?: string[];
    default?: any;
    properties?: {
        [key: string]: DataSchemaSpec;
    };
    additionalProperties?: DataSchemaSpec;
    items?: DataSchemaSpec;
}

export type UnknownDataSchema =
    StringDataSchema |
    NumberDataSchema |
    BooleanDataSchema |
    ObjectDataSchema<unknown, unknown> |
    ArrayDataSchema<unknown> |
    AnyDataSchema;

export type AnyDataSchema = {
    type: 'any';
    default?: unknown;
};

export type StringDataSchema = {
    type: 'string';
    kind?: StringPropKind;
    enum?: string[];
    default?: string;
};

export type NumberDataSchema = {
    type: 'number';
    kind?: NumberPropKind;
    default?: number;
};

export type BooleanDataSchema = {
    type: 'boolean';
    default?: boolean;
};

export type ObjectDataSchema<T, M> = {
    type: 'object';
    properties?: {
        [K in keyof T]-?: DataSchema<T[K]>;
    };
    additionalProperties?: DataSchema<M>;
};

export type ArrayDataSchema<T> = {
    type: 'array';
    items: DataSchema<T>;
};

export type NumberPropKind = 'float' | 'integer';

export type StringPropKind = 'default' | 'key' | 'param' | 'variable' | 'javascript' | 'json' | 'yaml' | 'selector';
