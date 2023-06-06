import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

/**
 * @deprecated use Output instead
 */
export const Result = ModuleSpecSchema.create({
    moduleName: 'Result',
    version: '1.0.0',
    resizeMode: 'none',
    hidden: true,
    params: {
        value: {
            schema: {
                type: 'any',
            },
        }
    },
    result: {
        schema: { type: 'any' },
        hideSocket: true,
    },
});
