import { DataSchema } from './data.js';

export type Lambda<Params, Result> = (params: Params) => Promise<Result>;

export type ParamDefs<P> = {
    [K in keyof P]: ParamDef<P[K]>;
};

export type ParamDef<T = unknown> =
    T extends Lambda<infer P, infer R> ?
    LambdaParamDef<P, R> :
    SimpleParamDef<T>;

export type SimpleParamDef<T = unknown> = {
    schema: DataSchema<T>;
    label?: string;
    addItemLabel?: string;
    removeItemLabel?: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    hideEntries?: boolean;
    hideValue?: boolean;
};

export type LambdaParamDef<P = unknown, R = unknown> = {
    kind: 'lambda';
    schema: DataSchema<R>;
    scope: {
        [K in keyof P]: DataSchema<P[K]>;
    };
    label?: string;
    default?: R;
};
