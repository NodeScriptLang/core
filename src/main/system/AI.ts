import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const AI = ModuleSpecSchema.create({
    moduleName: 'AI',
    version: '1.0.0',
    description: 'Generates a node with AI.',
    keywords: ['generate'],
    params: {
        inputs: {
            schema: {
                type: 'object',
            },
            attributes: {
                addItemLabel: 'Add input',
                removeItemLabel: 'Remove input',
            },
        },
        code: {
            schema: {
                type: 'string',
            },
            hideSocket: true,
            attributes: {
                renderer: 'javascript',
            },
        }
    },
    result: {
        schema: {
            type: 'any',
        }
    },
});
