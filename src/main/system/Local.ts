import { ModuleDefinition } from '../types/index.js';

export const Local: ModuleDefinition<{
    key: string;
}, any> = {
    moduleName: '@system/Local',
    label: 'Local',
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
