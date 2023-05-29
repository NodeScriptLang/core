import { GraphEvalContext, ModuleCompute, ModuleDefinition, SubgraphDefinition } from '../../main/types/index.js';

type P = {
    scope: Record<string, any>;
};

type R = Promise<unknown>;

type SIn = {
    [key: string]: unknown;
};

type SOut = {
    result: unknown;
};

const subgraph: SubgraphDefinition<SIn, SOut> = {
    input: {},
    output: {

        result: {
            schema: { type: 'any' },
        }
    }
};

export const module: ModuleDefinition<P, R> = {
    version: '1.0.0',
    moduleName: 'Flow / Step',
    params: {
        scope: {
            schema: {
                type: 'object',
                properties: {},
                additionalProperties: { type: 'any' },
            }
        },
    },
    result: {
        async: true,
        schema: {
            type: 'any',
        },
    },
    subgraph,
};

export const compute: ModuleCompute<P, R> = async (params, ctx) => {
    const { scope } = params;
    // TODO r1 obtain subgraph
    // ctx.getSubgraph<S>() or something nicer?
    const subgraph: (params: SIn, ctx: GraphEvalContext) => Promise<SOut> = (ctx as any).subgraph;
    const value = await subgraph({ ...scope }, ctx.newScope());
    return value;
};
