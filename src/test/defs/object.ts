import { Operator } from '../../main/types/defs.js';

export const node: Operator<{
    properties: any;
}, any> = {
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
    compute(params) {
        return params.properties;
    }
};
