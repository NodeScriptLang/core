import { SubgraphModuleCompute, SubgraphModuleDefinition } from '../../main/types/index.js';

type P = {
    scope: Record<string, any>;
};

type R = Promise<unknown>;

type SI = {
    [key: string]: unknown;
};

type SO = {
    result: unknown;
};

export const module: SubgraphModuleDefinition<P, R, SI, SO> = {
    version: '1.0.0',
    moduleName: 'Flow / Subgraph',
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
    subgraph: {
        input: {},
        output: { type: 'any' },
    },
};

export const compute: SubgraphModuleCompute<P, R, SI, SO> = async (params, ctx, subgraph) => {
    const { scope } = params;
    const value = await subgraph({ ...scope }, ctx.newScope());
    return value;
};
