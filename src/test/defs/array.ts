import { Operator } from '../../main/types/defs.js';

export const node: Operator<{
    items: any[];
}, any[]> = {
    label: 'Array',
    description: 'Creates an array.',
    params: {
        items: {
            schema: {
                type: 'array',
                items: {
                    type: 'any',
                },
            }
        },
    },
    result: {
        type: 'array',
        items: { type: 'any' },
    },
    compute(params) {
        return params.items;
    }
};
