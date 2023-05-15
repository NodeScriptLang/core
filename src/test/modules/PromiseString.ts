import { ModuleCompute, ModuleDefinition } from '../../main/types/index.js';

type P = {
    value: string;
};

type R = Promise<any>;

export const module: ModuleDefinition<P, R> = {
    moduleName: 'Promise String',
    version: '1.0.0',
    description: 'Returns the string value asynchronously.',
    params: {
        value: {
            schema: {
                type: 'string'
            }
        },
    },
    result: {
        schema: {
            type: 'string',
        },
        async: true,
    },
};

export const compute: ModuleCompute<P, R> = async (params: P) => {
    return params.value;
};
