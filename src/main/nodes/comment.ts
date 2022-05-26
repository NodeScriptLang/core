import * as t from '../types/index.js';

export const Comment: t.Operator<{
    comment: string;
}, any> = {
    label: 'Comment',
    category: ['Utils'],
    params: {
        comment: {
            schema: {
                type: 'string'
            },
        }
    },
    returns: { type: 'any' },
    compute() {},
};
