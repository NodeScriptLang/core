import { GraphEvalContext } from './ctx.js';
import { DataSchema } from './data.js';
import { NodeCompile } from './node-compile.js';
import { NodeHooks } from './node-hooks.js';
import { NodeMetadata } from './node-metadata.js';
import { ParamDefs } from './param-def.js';

export type Operator<Params = any, Result = any> = {
    metadata: OperatorMetadata<Params, Result>;
    compute: OperatorCompute<Params, Result>;
    compile?: NodeCompile;
    hooks?: NodeHooks;
};

export type OperatorMetadata<Params = any, Result = any> =
    Partial<NodeMetadata> & {
        label: string;
        params: ParamDefs<Params>;
        result: Result extends Promise<infer R> ? DataSchema<R> : DataSchema<Result>;
    } & (Result extends Promise<any> ? { async: true } : {});

export type OperatorCompute<P, R> = (this: void, params: P, ctx: GraphEvalContext) => R;
