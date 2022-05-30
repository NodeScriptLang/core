import * as t from '../types/index.js';

export const Comment: t.Operator<{
    comment: string;
}, any> = {
    label: 'Comment',
    category: ['Graph'],
    params: {
        comment: {
            schema: {
                type: 'string'
            },
        }
    },
    result: { type: 'any' },
    compute() {},
};
