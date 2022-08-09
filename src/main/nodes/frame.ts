import * as t from '../types/index.js';

export const Frame: t.Operator<{}, any> = {
    metadata: {
        label: 'Frame',
        params: {},
        result: { type: 'any' },
    },
    compute() {},
};
