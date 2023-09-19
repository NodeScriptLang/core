import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const Frame = ModuleSpecSchema.create({
    moduleName: 'Frame',
    version: '1.0.0',
    resizeMode: 'all',
    params: {},
    result: {
        schema: { type: 'any' },
        hideSocket: true,
    },
    attributes: {
        hideEvalControls: true,
        hidden: true,
    },
});
