import * as t from '../types/index.js';

export const Frame: t.Operator<{}, any> = {
    metadata: {
        label: 'Frame',
        resizeMode: 'all',
        params: {},
        result: { type: 'any' },
    },
    compute() {},
};
