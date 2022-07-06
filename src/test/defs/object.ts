import { Operator } from '../../main/types/index.js';

export const node: Operator<{
    properties: any;
}, any> = {
    metadata: {
        label: 'Object',
        description: 'Creates an object.',
        params: {
            properties: {
                schema: {
                    type: 'object',
                }
            },
        },
        result: {
            type: 'object',
        },
    },
    compute(params) {
        return params.properties;
    }
};
