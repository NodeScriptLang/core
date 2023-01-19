import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const Param = ModuleSpecSchema.create({
    moduleId: '@system/Param',
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
