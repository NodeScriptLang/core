import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const EvalJson = ModuleSpecSchema.create({
    moduleName: 'Eval / Json',
    version: '0.0.0',
    description: 'Returns a JSON value.',
    keywords: ['eval', 'json', 'data'],
    resizeMode: 'all',
    params: {
        code: {
            schema: {
                type: 'string',
            },
            hideSocket: true,
            attributes: {
                renderer: 'json',
            },
        }
    },
    result: {
        schema: {
            type: 'any',
        }
    }
});
