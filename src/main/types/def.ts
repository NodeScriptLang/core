import { DataSchema } from './data-schema.js';
import { ModuleParamSpec, ModuleResultSpec, ModuleSpec } from './module.js';

export type Lambda<Params, Result> = (params: Params) => Promise<Result>;

export type ModuleDefinition<P, R> = Partial<ModuleSpec> & {
    label: string;
    params: ParamsDefinition<P>;
    result: ResultDefinition<R>;
};

export type ParamsDefinition<P> = {
    [K in keyof P]: ParamDef<P[K]>;
};

export type ResultDefinition<R> = Partial<ModuleResultSpec> & {
    schema: DataSchema<R>;
};

export type ParamDef<T = unknown> =
    T extends Lambda<infer P, infer R> ?
    LambdaParamDef<P, R> :
    SimpleParamDef<T>;

export type SimpleParamDef<T = unknown> = Partial<ModuleParamSpec> & {
    schema: DataSchema<T>;
    default?: T;
};

export type LambdaParamDef<P = unknown, R = unknown> = Partial<ModuleParamSpec> & {
    kind: 'lambda';
    schema: DataSchema<R>;
    scope: {
        [K in keyof P]: DataSchema<P[K]>;
    };
    default?: R;
};
