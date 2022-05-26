import * as t from '../types/index.js';

export const Local: t.Operator<{
    key: string;
}, any> = {
    label: 'Local',
    category: ['Graph'],
    params: {
        key: {
            schema: {
                type: 'string',
            },
        }
    },
    returns: { type: 'any' },
    compute(params, ctx) {
        return ctx.getLocal(params.key);
    }
};
