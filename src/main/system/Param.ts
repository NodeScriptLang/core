import { ModuleDefinition } from '../types/index.js';

export const Param: ModuleDefinition<{
    key: string;
}, any> = {
    moduleId: '@system/Param',
    version: '0.0.0',
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
