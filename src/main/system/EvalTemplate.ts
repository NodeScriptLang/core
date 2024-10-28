import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const EvalTemplate = ModuleSpecSchema.create({
    moduleName: 'Eval / Template',
    version: '1.0.0',
    description: 'Evaluates a JavaScript template string. ' +
        'Use ${expression} syntax to insert argument values or arbitrary expressions.',
    keywords: ['string', 'expression'],
    params: {
        args: {
            schema: {
                type: 'object',
            },
            attributes: {
                addItemLabel: 'Add argument',
                removeItemLabel: 'Remove argument',
            },
        },
        template: {
            schema: {
                type: 'string',
            },
            hideSocket: true,
            attributes: {
                renderer: 'textarea',
            },
        }
    },
    result: {
        schema: {
            type: 'any',
        }
    },
});
