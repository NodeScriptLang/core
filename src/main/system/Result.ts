import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const Result = ModuleSpecSchema.create({
    moduleId: '@system/Result',
    moduleName: 'Result',
    version: '0.0.0',
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
