import { ModuleCompute, ModuleDefinition } from '../../main/types/index.js';

type P = {
    properties: any;
};

type R = any;

export const module: ModuleDefinition<P, R> = {
    label: 'Object',
    description: 'Creates an object.',
    params: {
        properties: {
            schema: {
                type: 'object',
            }
        },
    },
    result: {
        schema: {
            type: 'object',
        }
    },
};

export const compute: ModuleCompute<P, R> = params => {
    return params.properties;
};
