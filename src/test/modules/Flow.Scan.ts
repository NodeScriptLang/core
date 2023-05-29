import { GraphEvalContext, ModuleCompute, ModuleDefinition, SubgraphDefinition } from '../../main/types/index.js';

type P = {
    array: unknown[];
    scope: Record<string, any>;
};

type R = Promise<unknown>;

type SIn = {
    item: unknown;
    index: number;
    [key: string]: unknown;
};

type SOut = {
    done: boolean;
    result: unknown;
};

const subgraph: SubgraphDefinition<SIn, SOut> = {
    input: {
        item: {
            schema: { type: 'any' },
        },
        index: {
            schema: { type: 'number' },
        },
    },
    output: {
        done: {
            schema: { type: 'boolean' },
        },
        result: {
            schema: { type: 'any' },
        }
    }
};

export const module: ModuleDefinition<P, R> = {
    version: '0.1.0',
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
    subgraph,
};

export const compute: ModuleCompute<P, R> = async (params, ctx) => {
    const { array, scope } = params;
    // TODO r1 obtain subgraph
    // ctx.getSubgraph<S>() or something nicer?
    const subgraph: (params: SIn, ctx: GraphEvalContext) => Promise<SOut> = (ctx as any).subgraph;
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
