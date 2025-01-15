import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const Scope = ModuleSpecSchema.create({
    moduleName: 'Scope',
    version: '0.0.0',
    params: {
    },
    result: {
        schema: { type: 'any' },
    },
    cacheMode: 'never',
    attributes: {
        hidden: true,
        hideEvalControls: true,
        forceColor: 'cyan',
    }
});
