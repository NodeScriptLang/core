import { ModuleDefinition } from '../types/def.js';

export const Comment: ModuleDefinition<{
    comment: string;
}, any> = {
    moduleName: '@system/Comment',
    version: '0.0.0',
    label: 'Comment',
    resizeMode: 'all',
    params: {
        comment: {
            schema: { type: 'string' },
        }
    },
    result: {
        schema: { type: 'any' },
    },
};
