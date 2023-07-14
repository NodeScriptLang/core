import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const Subgraph = ModuleSpecSchema.create({
    moduleName: 'Subgraph',
    version: '1.0.0',
    description: 'Contains a subgraph',
    resizeMode: 'horizontal',
    params: {
        scope: {
            schema: {
                type: 'object',
                properties: {},
                additionalProperties: { type: 'any' },
            }
        },
    },
    result: {
        async: true,
        schema: {
            type: 'any',
        },
    },
    subgraph: {
        input: {},
        output: {
            type: 'any',
        },
    },
});
