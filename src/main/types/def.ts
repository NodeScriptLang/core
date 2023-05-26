import { SchemaDef } from 'airtight';

import { ModuleVersion } from '../schema/ModuleVersion.js';
import { GraphEvalContext } from './ctx.js';
import { ModuleParamSpec, ModuleResultSpec, ModuleSpec } from './module.js';

export type ModuleDefinition<P = unknown, R = unknown, S = undefined> = Omit<Partial<ModuleSpec>, 'params' | 'result' | 'scope'> & {
    moduleName: string;
    version: ModuleVersion;
    params: ParamsDefinition<P>;
    result: ResultDefinition<R>;
} & (S extends undefined ? {} : {
    scope: ParamsDefinition<S>;
});

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
