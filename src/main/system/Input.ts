import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const Input = ModuleSpecSchema.create({
    moduleName: 'Input',
    version: '1.0.0',
    hidden: true,
    params: {},
    result: {
        schema: { type: 'any' },
    },
    cacheMode: 'never',
});
