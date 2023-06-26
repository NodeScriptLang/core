import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const EvalAsync = ModuleSpecSchema.create({
    moduleName: 'Eval / Async',
    version: '1.0.0',
    description: 'Evaluates asynchronous JavaScript code with provided arguments.',
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
        }
    },
    result: {
        async: true,
        schema: {
            type: 'any',
        }
    },
});
