import * as t from '../types/index.js';

export const Local: t.Operator<{
    key: string;
}, any> = {
    metadata: {
        label: 'Local',
        params: {
            key: {
                schema: {
                    type: 'string',
                },
            }
        },
        result: { type: 'any' },
        hidden: true,
    },
    compute() {}
};
