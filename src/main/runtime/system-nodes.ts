import * as t from '../types/index.js';

export const Comment: t.NodeDef<{
    comment: string;
}, any> = {
    ref: 'Comment',
    label: 'Comment',
    category: ['Utils'],
    params: {
        comment: {
            schema: {
                type: 'string'
            },
        }
    },
    returns: { type: 'any' },
    compute() {},
};

export const Local: t.NodeDef<{
    key: string;
}, any> = {
    ref: 'Local',
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

export const Param: t.NodeDef<{
    key: string;
}, any> = {
    ref: 'Param',
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
    returns: { type: 'any' },
    compute() {}
};

export const Result: t.NodeDef<{
    value: any;
}, any> = {
    ref: 'Result',
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
