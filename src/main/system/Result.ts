import { ModuleDefinition } from '../types/index.js';

export const Result: ModuleDefinition<{
    value: unknown;
}, any> = {
    moduleId: '@system/Result',
    version: '0.0.0',
    label: 'Result',
    resizeMode: 'none',
    hidden: true,
    params: {
        value: {
            schema: {
                type: 'any',
            },
        }
    },
    result: {
        schema: { type: 'any' },
        hideSocket: true,
    },
};
