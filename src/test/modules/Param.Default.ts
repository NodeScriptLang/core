import { ModuleCompute, ModuleDefinition } from '../../main/types/index.js';

type P = {
    value: string;
};

type R = string;

export const module: ModuleDefinition<P, R> = {
    moduleId: 'Param.Default',
    moduleName: 'Default Param',
    version: '1.0.0',
    description: 'A node that has a parameter with default value',
    params: {
        value: {
            schema: {
                type: 'string',
                default: 'Hello',
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
