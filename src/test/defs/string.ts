import { ModuleCompute, ModuleDefinition } from '../../main/types/index.js';

type P = {
    value: unknown;
};

type R = string;

export const module: ModuleDefinition<P, R> = {
    label: 'String',
    description: 'Converts the value into a string.',
    params: {
        value: {
            schema: {
                type: 'any'
            }
        },
    },
    result: {
        schema: {
            type: 'string',
        }
    },
};

export const compute: ModuleCompute<P, R> = params => {
    return String(params.value);
};
