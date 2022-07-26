import { Operator } from '../../main/types/index.js';

export const node: Operator<{
    value: string;
}, string> = {
    metadata: {
        label: 'Default Param',
        description: 'A node that has a parameter with default value',
        params: {
            value: {
                schema: {
                    type: 'string',
                    default: 'Hello',
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
