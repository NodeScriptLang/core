import { ModuleSpecSchema } from '../schema/ModuleSpec.js';
import { ModuleSpec } from '../types/module.js';

export const Comment: ModuleSpec = ModuleSpecSchema.create({
    moduleName: 'Comment',
    version: '1.0.0',
    resizeMode: 'all',
    // TODO migrate to metadata.label
    params: {
        comment: {
            schema: { type: 'string' },
        }
    },
    result: {
        schema: { type: 'any' },
    },
});
