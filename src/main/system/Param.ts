import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

/**
 * @deprecated use Input instead
 */
export const Param = ModuleSpecSchema.create({
    moduleName: 'Param',
    version: '0.0.0',
    resizeMode: 'none',
    hidden: true,
    params: {
        key: {
            schema: {
                type: 'string',
            },
        }
    },
    result: {
        schema: { type: 'any' },
    },
    cacheMode: 'never',
});
