import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const Input = ModuleSpecSchema.create({
    moduleName: 'Inputs',
    version: '1.0.0',
    params: {},
    result: {
        schema: { type: 'any' },
    },
    cacheMode: 'never',
    attributes: {
        hidden: true,
    },
});
