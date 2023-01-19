import { ModuleCompute, ModuleDefinition } from '../../main/types/index.js';

type P = { value: unknown };
type R = unknown;

export const module: ModuleDefinition<P, R> = {
    moduleName: 'Any',
    version: '1.0.0',
    description: 'Just returns the value as is, without type conversion.',
    params: {
        value: {
            schema: {
                type: 'any'
            }
        },
    },
    result: {
        schema: {
            type: 'any',
        }
    },
};

export const compute: ModuleCompute<P, R> = params => {
    return params.value;
};
