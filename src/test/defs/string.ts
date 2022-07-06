import { Operator } from '../../main/types/index.js';

export const node: Operator<{
    value: unknown;
}, string> = {
    metadata: {
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
    },
    compute(params) {
        return String(params.value);
    }
};
