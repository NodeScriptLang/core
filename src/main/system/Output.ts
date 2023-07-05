import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const Output = ModuleSpecSchema.create({
    moduleName: 'Output',
    version: '1.0.0',
    hidden: true,
    hideEvalControls: true,
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
