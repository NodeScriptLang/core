import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const EvalSync = ModuleSpecSchema.create({
    moduleName: 'Eval / Sync',
    version: '1.0.0',
    description: 'Evaluates synchronous JavaScript code with provided arguments.',
    keywords: ['eval', 'compute', 'js', 'javascript', 'function', 'execute', 'expression', 'sync'],
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
        schema: {
            type: 'any',
        }
    },
});
