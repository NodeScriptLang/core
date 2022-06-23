import * as t from '../types/index.js';

export const Result: t.Operator<{
    value: any;
}, any> = {
    metadata: {
        label: 'Result',
        params: {
            value: {
                schema: {
                    type: 'any',
                },
            }
        },
        result: { type: 'any' },
    },
    compute() {},
};
