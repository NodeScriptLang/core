import { Operator } from '../../main/types/defs.js';

export const node: Operator<{
    a: number;
    b: number;
}, number> = {
    label: 'Math.Add',
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
    compute(params) {
        return params.a + params.b;
    }
};