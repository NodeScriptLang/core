import * as t from '../types/index.js';

export const Local: t.Operator<{
    key: string;
}, any> = {
    metadata: {
        label: 'Local',
        category: ['Graph'],
        params: {
            key: {
                schema: {
                    type: 'string',
                },
            }
        },
        result: { type: 'any' },
    },
    compute() {}
};
