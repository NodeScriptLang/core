import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const EvalJson = ModuleSpecSchema.create({
    moduleName: 'Eval / Json',
    version: '1.0.0',
    description: 'Returns a JSON value.',
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
            minHeight: 4,
        }
    },
    result: {
        schema: {
            type: 'any',
        }
    }
});
