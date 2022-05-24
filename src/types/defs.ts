import { GraphEvalContext } from './context.js';
import { DataSchema } from './data.js';

/**
 * These fields are optional when you define them in TypeScript.
 */
export type NodeDescription = {
    category: string[];
    label: string;
    description: string;
    deprecated: string;
    hidden: boolean;
};

/**
 * The type you obtain from the resolver.
 * `compute` may or may not exist depending on the environment.
 */
export type NodeMetadata = {
    ref: string;
    params: Record<string, ParamDef>;
    returns: DataSchema<unknown>;
    compute?: (...args: unknown[]) => unknown;
} & NodeDescription;

/**
 * The type used when defining nodes in TypeScript.
 * Type parameters correspond to params (P) and return value (R).
 */
export type NodeDef<P = unknown, R = unknown> = {
    ref: string;
    params: ParamDefs<P>;
    returns: DataSchema<R>;
    compute: NodeCompute<P, R>;
} & Partial<NodeDescription>;

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
