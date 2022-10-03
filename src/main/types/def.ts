import { GraphEvalContext } from './ctx.js';
import { DataSchema } from './data-schema.js';
import { ModuleParamSpec, ModuleResultSpec, ModuleSpec } from './module.js';

export type Lambda<Params, Result> = (params: Params) => Promise<Result>;

export type ModuleDefinition<P = unknown, R = unknown> = Omit<Partial<ModuleSpec>, 'params' | 'result'> & {
    moduleName: string;
    label: string;
    params: ParamsDefinition<P>;
    result: ResultDefinition<R>;
};

export type ParamsDefinition<P> = {
    [K in keyof P]: ParamDef<P[K]>;
};

export type ResultDefinition<R> = Partial<ModuleResultSpec> & {
    schema: R extends Promise<infer T> ? DataSchema<T> : DataSchema<R>;
} & (R extends Promise<any> ? { async: true } : {});

export type ParamDef<T = unknown> =
    T extends Lambda<infer P, infer R> ?
    LambdaParamDef<P, R> :
    SimpleParamDef<T>;

export type SimpleParamDef<T = unknown> = Omit<Partial<ModuleParamSpec>, 'schema' | 'default'> & {
    schema: DataSchema<T>;
};

export type LambdaParamDef<P = unknown, R = unknown> = Partial<ModuleParamSpec> & {
    kind: 'lambda';
    schema: DataSchema<R>;
    scope: {
        [K in keyof P]: DataSchema<P[K]>;
    };
};

export type ModuleCompute<P, R> = (this: void, params: P, ctx: GraphEvalContext) => R;
