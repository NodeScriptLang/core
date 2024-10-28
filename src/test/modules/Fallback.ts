import { ModuleCompute, ModuleDefinition } from '../../main/types/index.js';

type P = {
    steps: unknown[];
};
type R = Promise<any>;

export const module: ModuleDefinition<P, R> = {
    moduleName: 'Fallback',
    version: '1.0.0',
    params: {
        steps: {
            deferred: true,
            schema: {
                type: 'array',
                items: { type: 'any' },
            }
        },
    },
    result: {
        async: true,
        schema: {
            type: 'any',
        }
    }
};

export const compute: ModuleCompute<P, R> = async (params, ctx) => {
    for (const step of params.steps) {
        try {
            const value = await ctx.resolveDeferred(step);
            if (value != null) {
                return value;
            }
        } catch (_err) {}
    }
    return null;
};
