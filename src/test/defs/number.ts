import { Operator } from '../../main/types/defs.js';

export const node: Operator<{
    value: unknown;
}, number> = {
    metadata: {
        label: 'Number',
        description: 'Converts the value into a number.',
        params: {
            value: {
                schema: {
                    type: 'any'
                }
            },
        },
        result: {
            type: 'number',
        },
    },
    compute(params) {
        return Number(params.value);
    }
};
