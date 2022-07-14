import { Operator } from '../../main/types/index.js';

export const node: Operator<{
    value: any;
}, Promise<any>> = {
    metadata: {
        label: 'Promise',
        description: 'Returns the value asynchronously.',
        async: true,
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
    async compute(params) {
        return params.value;
    }
};
