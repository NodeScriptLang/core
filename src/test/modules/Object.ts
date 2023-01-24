import { ModuleCompute, ModuleDefinition } from '../../main/types/index.js';

type P = {
    properties: any;
};

type R = any;

export const module: ModuleDefinition<P, R> = {
    moduleName: 'Object',
    version: '1.0.0',
    description: 'Creates an object.',
    params: {
        properties: {
            schema: {
                type: 'object',
                properties: {},
                additionalProperties: { type: 'any' },
            }
        },
    },
    result: {
        schema: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        }
    },
};

export const compute: ModuleCompute<P, R> = params => {
    return params.properties;
};
