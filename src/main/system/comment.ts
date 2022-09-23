import { ModuleDefinition } from '../types/def.js';

export const Comment: ModuleDefinition<{
    comment: string;
}, any> = {
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
