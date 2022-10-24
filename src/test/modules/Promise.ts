import { ModuleCompute, ModuleDefinition } from '../../main/types/index.js';

type P = {
    value: any;
};

type R = Promise<any>;

export const module: ModuleDefinition<P, R> = {
    moduleName: 'Promise',
    version: '1.0.0',
    label: 'Promise',
    description: 'Returns the value asynchronously.',
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
        },
        async: true,
    },
};

export const compute: ModuleCompute<P, R> = (params: P) => {
    return params.value;
};
