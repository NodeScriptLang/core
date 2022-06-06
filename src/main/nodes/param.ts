import * as t from '../types/index.js';

export const Param: t.Operator<{
    key: string;
}, any> = {
    metadata: {
        label: 'Parameter',
        category: ['Graph'],
        params: {
            key: {
                schema: {
                    type: 'string',
                    kind: 'param',
                },
            }
        },
        result: { type: 'any' },
    },
    compute() {}
};
