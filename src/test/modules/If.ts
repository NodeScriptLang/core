import { ModuleCompute, ModuleDefinition } from '../../main/types/index.js';

type P = {
    condition: boolean;
    positive: unknown;
    negative: unknown;
};
type R = any;

export const module: ModuleDefinition<P, R> = {
    moduleName: 'If',
    version: '1.0.0',
    params: {
        condition: {
            schema: { type: 'boolean' }
        },
        positive: {
            deferred: true,
            schema: { type: 'any' }
        },
        negative: {
            deferred: true,
            schema: { type: 'any' }
        },
    },
    result: {
        schema: {
            type: 'any',
        }
    }
};

export const compute: ModuleCompute<P, R> = (params, ctx) => {
    return params.condition ?
        ctx.resolveDeferred(params.positive) :
        ctx.resolveDeferred(params.negative);
};
