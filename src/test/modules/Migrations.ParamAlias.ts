import { ModuleCompute, ModuleDefinition } from '../../main/types/index.js';

type P = { value: unknown };
type R = any;

export const module: ModuleDefinition<P, R> = {
    moduleName: 'Migrations / Param Alias',
    version: '1.0.0',
    description: 'Returns the value, but supports a couple of aliases (for migration purposes)',
    params: {
        value: {
            schema: {
                type: 'any'
            },
            attributes: {
                aliases: ['val', 'object', 'field'],
            },
        },
    },
    result: {
        schema: {
            type: 'any',
        }
    }
};

export const compute: ModuleCompute<P, R> = params => {
    return params.value;
};
