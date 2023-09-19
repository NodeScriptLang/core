import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const Frame = ModuleSpecSchema.create({
    moduleName: 'Frame',
    version: '1.0.0',
    resizeMode: 'all',
    hideEvalControls: true,
    hidden: true,
    params: {},
    result: {
        schema: { type: 'any' },
        hideSocket: true,
    },
});
