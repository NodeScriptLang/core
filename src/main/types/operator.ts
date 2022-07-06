import { GraphEvalContext } from './ctx.js';
import { DataSchema } from './data.js';
import { NodeMetadata } from './node-metadata.js';
import { ParamDefs } from './param-def.js';

export type Operator<Params = any, Result = any> = {
    metadata: OperatorMetadata<Params, Result>;
    compute: OperatorCompute<Params, Result>;
};

export type OperatorMetadata<Params = any, Result = any> =
    Partial<NodeMetadata> & {
        label: string;
        params: ParamDefs<Params>;
        result: DataSchema<Result>;
    };

export type OperatorCompute<P, R> = (this: void, params: P, ctx: GraphEvalContext) => R | Promise<R>;
