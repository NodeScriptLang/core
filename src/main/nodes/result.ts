import * as t from '../types/index.js';

export const Result: t.Operator<{
    value: any;
}, any> = {
    label: 'Result',
    category: ['Graph'],
    params: {
        value: {
            schema: {
                type: 'any',
            },
        }
    },
    returns: { type: 'any' },
    compute() {},
};
