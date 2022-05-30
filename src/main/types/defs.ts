import { GraphEvalContext } from './ctx.js';
import { DataSchema } from './data.js';

export type NodeDef = {
    label: string;
    category: string[];
    description: string;
    deprecated: string;
    hidden: boolean;
    params: Record<string, ParamDef>;
    result: DataSchema<any>;
    compute: (...args: any[]) => any;
};

export type Operator<Params = any, Result = any> = {
    label: string;
    category?: string[];
    description?: string;
    deprecated?: string;
    hidden?: boolean;
    params: ParamDefs<Params>;
    result: DataSchema<Result>;
    compute: NodeCompute<Params, Result>;
};

export type NodeCompute<P, R> = (this: void, params: P, ctx: GraphEvalContext) => R | Promise<R>;

export type Lambda<P, R> = (params: P) => Promise<R>;

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
