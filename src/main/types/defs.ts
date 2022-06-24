import { GraphEvalContext } from './ctx.js';
import { DataSchema } from './data.js';

export type NodeMetadata = {
    label: string;
    description: string;
    deprecated: string;
    hidden: boolean;
    params: Record<string, ParamMetadata>;
    result: DataSchema<any>;
};

export type NodeDef = {
    metadata: NodeMetadata;
    compute: (...args: any[]) => any;
};

export type Operator<Params = any, Result = any> = {
    metadata: OperatorMetadata<Params, Result>;
    compute: NodeCompute<Params, Result>;
};

export type OperatorMetadata<Params = any, Result = any> =
    Partial<NodeMetadata> & {
        label: string;
        params: ParamDefs<Params>;
        result: DataSchema<Result>;
    };

export type NodeCompute<P, R> = (this: void, params: P, ctx: GraphEvalContext) => R | Promise<R>;

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

export type ParamMetadata = {
    kind?: 'lambda';
    schema: DataSchema;
    scope?: Record<string, DataSchema>;
    default?: string;
    label?: string;
    addItemLabel?: string;
    removeItemLabel?: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    hideEntries?: boolean;
};
