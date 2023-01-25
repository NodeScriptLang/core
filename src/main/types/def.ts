import { SchemaDef } from 'airtight';

import { ModuleVersion } from '../schema/ModuleVersion.js';
import { GraphEvalContext } from './ctx.js';
import { ModuleParamSpec, ModuleResultSpec, ModuleSpec } from './module.js';

export type ModuleDefinition<P = unknown, R = unknown> = Omit<Partial<ModuleSpec>, 'params' | 'result'> & {
    moduleName: string;
    version: ModuleVersion;
    params: ParamsDefinition<P>;
    result: ResultDefinition<R>;
};

export type ParamsDefinition<P> = {
    [K in keyof P]-?: ParamDef<P[K]>;
};

export type ResultDefinition<R> = Partial<ModuleResultSpec> & {
    schema: R extends Promise<infer T> ? SchemaDef<T> : SchemaDef<R>;
} & (R extends Promise<any> ? { async: true } : {});

export type ParamDef<T = unknown> = SimpleParamDef<T>;

export type SimpleParamDef<T = unknown> = Omit<Partial<ModuleParamSpec>, 'schema'> & {
    schema: SchemaDef<T>;
};

export type ModuleCompute<P, R> = (this: void, params: P, ctx: GraphEvalContext) => R;
