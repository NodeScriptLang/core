import { ModuleDefinition } from '../types/index.js';

export const Param: ModuleDefinition<{
    key: string;
}, any> = {
    moduleName: '@system/Param',
    label: 'Param',
    resizeMode: 'none',
    hidden: true,
    params: {
        key: {
            schema: {
                type: 'string',
            },
        }
    },
    result: {
        schema: { type: 'any' },
    },
};
