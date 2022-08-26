import * as t from '../types/index.js';

export const Result: t.Operator<{
    value: any;
}, any> = {
    metadata: {
        label: 'Result',
        resizeMode: 'none',
        params: {
            value: {
                schema: {
                    type: 'any',
                },
                hideValue: true,
            }
        },
        result: { type: 'any' },
        hidden: true,
        hideOutboundSocket: true,
    },
    compute() {},
};
