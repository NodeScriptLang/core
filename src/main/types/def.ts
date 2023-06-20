import { SchemaDef } from 'airtight';

import { ModuleVersion } from '../schema/ModuleVersion.js';
import { GraphEvalContext } from './ctx.js';
import { ModuleParamSpec, ModuleResultSpec, ModuleSpec } from './module.js';

export type ModuleDefinition<P, R> = Omit<Partial<ModuleSpec>, 'params' | 'result' | 'subgraph'> & {
    moduleName: string;
    version: ModuleVersion;
    params: ParamsDefinition<P>;
    result: ResultDefinition<R>;
};

export type SubgraphModuleDefinition<P, R, SI, SO> = ModuleDefinition<P, R> & {
    subgraph: SubgraphDefinition<SI, SO>;
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

export type SubgraphModuleCompute<P, R, SI, SO> = (this: void, params: P, ctx: GraphEvalContext, subgraph: ModuleCompute<SI, Promise<SO>>) => R;

export type SubgraphDefinition<SI, SO> = {
    input: SubgraphSchemaObject<SI>;
    output: SchemaDef<SO>;
};

export type SubgraphSchemaObject<O> = {
    [K in keyof O]-?: SchemaDef<O[K]>;
};
