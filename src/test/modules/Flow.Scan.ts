import { SubgraphModuleCompute, SubgraphModuleDefinition } from '../../main/types/index.js';

type P = {
    array: unknown[];
    scope: Record<string, any>;
};

type R = Promise<unknown>;

type SI = {
    item: unknown;
    index: number;
    [key: string]: unknown;
};

type SO = {
    done: boolean;
    result: unknown;
};

export const module: SubgraphModuleDefinition<P, R, SI, SO> = {
    version: '1.0.0',
    moduleName: 'Flow / Scan',
    description: 'Executes a subgraph for each array item. The subgraph decides whether to continue iterating or not and what result to return.',
    keywords: ['flow'],
    params: {
        array: {
            schema: {
                type: 'array',
                items: { type: 'any' },
            },
        },
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
        input: {
            item: { type: 'any' },
            index: { type: 'number' },
        },
        output: {
            done: { type: 'boolean' },
            result: { type: 'any' },
        }
    },
};

export const compute: SubgraphModuleCompute<P, R, SI, SO> = async (params, ctx, subgraph) => {
    const { array, scope } = params;
    for (let index = 0; index < array.length; index++) {
        const item = array[index];
        const res = await subgraph({
            item,
            index,
            ...scope,
        }, ctx.newScope());
        if (res.done) {
            return res.result;
        }
    }
    return null;
};
