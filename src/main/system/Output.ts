import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const Output = ModuleSpecSchema.create({
    moduleName: 'Output',
    version: '1.0.0',
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
    attributes: {
        hideEvalControls: true,
        forceColor: 'yellow',
    },
});
