import { ModuleCompute, ModuleDefinition } from '../../main/types/index.js';

type P = { object: any; key: string };
type R = unknown;

export const module: ModuleDefinition<P, R> = {
    moduleId: 'Get',
    moduleName: 'Get',
    version: '1.0.0',
    params: {
        object: {
            schema: {
                type: 'any'
            }
        },
        key: {
            schema: {
                type: 'string'
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
    return params.object[params.key];
};
