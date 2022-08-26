import * as t from '../types/index.js';

export const Comment: t.Operator<{
    comment: string;
}, any> = {
    metadata: {
        label: 'Comment',
        resizeMode: 'all',
        params: {
            comment: {
                schema: {
                    type: 'string'
                },
            }
        },
        result: { type: 'any' },
    },
    compute() {},
};
