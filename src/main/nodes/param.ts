import * as t from '../types/index.js';

export const Param: t.Operator<{
    key: string;
}, any> = {
    metadata: {
        label: 'Parameter',
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
