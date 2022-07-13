import { Operator } from '../../main/types/index.js';

export const node: Operator<{
    a: number;
    b: number;
}, number> = {
    metadata: {
        label: 'Math.Add',
        description: 'Computes a sum of two numbers.',
        keywords: ['math', 'add', 'plus', 'sum'],
        params: {
            a: {
                schema: {
                    type: 'number'
                }
            },
            b: {
                schema: {
                    type: 'number'
                }
            }
        },
        result: {
            type: 'number',
        },
    },
    compute(params) {
        return params.a + params.b;
    }
};
