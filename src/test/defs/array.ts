import { Operator } from '../../main/types/index.js';

export const node: Operator<{
    items: any[];
}, any[]> = {
    metadata: {
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
    },
    compute(params) {
        return params.items;
    }
};
