import { ModuleSpecSchema } from '../schema/ModuleSpec.js';
import { ModuleSpec } from '../types/module.js';

export const Comment: ModuleSpec = ModuleSpecSchema.create({
    moduleId: '@system/Comment',
    moduleName: 'Comment',
    version: '0.0.0',
    resizeMode: 'all',
    params: {
        comment: {
            schema: { type: 'string' },
        }
    },
    result: {
        schema: { type: 'any' },
    },
});
