import { Operator } from '../../main/types/defs.js';

export const node: Operator<{
    value: unknown;
}, unknown> = {
    metadata: {
        label: 'Any',
        description: 'Just returns the value as is, without type conversion.',
        params: {
            value: {
                schema: {
                    type: 'any'
                }
            },
        },
        result: {
            type: 'any',
        },
    },
    compute(params) {
        return params.value;
    }
};
