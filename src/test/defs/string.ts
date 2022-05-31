import { Operator } from '../../main/types/defs.js';

export const node: Operator<{
    value: unknown;
}, string> = {
    label: 'String',
    description: 'Converts the value into a string.',
    params: {
        value: {
            schema: {
                type: 'any'
            }
        },
    },
    result: {
        type: 'string',
    },
    compute(params) {
        return String(params.value);
    }
};
