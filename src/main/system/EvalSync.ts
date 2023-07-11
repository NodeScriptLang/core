import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const EvalSync = ModuleSpecSchema.create({
    moduleName: 'Eval / Sync',
    version: '1.0.0',
    description: 'Evaluates synchronous JavaScript code with provided arguments.',
    keywords: ['javascript', 'expression'],
    resizeMode: 'all',
    params: {
        args: {
            schema: {
                type: 'object',
            },
            addItemLabel: 'Add argument',
            removeItemLabel: 'Remove argument',
        },
        code: {
            schema: {
                type: 'string',
            },
            hideSocket: true,
            attributes: {
                renderer: 'javascript',
            },
            minHeight: 4,
        }
    },
    result: {
        schema: {
            type: 'any',
        }
    },
});
