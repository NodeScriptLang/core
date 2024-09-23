import { ModuleSpecSchema } from '../schema/ModuleSpec.js';
import { ModuleSpec } from '../types/module.js';

export const Comment: ModuleSpec = ModuleSpecSchema.create({
    moduleName: 'Comment',
    version: '1.0.0',
    params: {
        comment: {
            schema: { type: 'string' },
            hideSocket: true,
            attributes: {
                renderer: 'textarea',
                minHeight: 2,
            },
        }
    },
    result: {
        schema: { type: 'any' },
        hideSocket: true,
    },
    attributes: {
        hideEvalControls: true,
    },
});
