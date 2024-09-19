import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const Param = ModuleSpecSchema.create({
    moduleName: 'Param',
    version: '0.0.0',
    params: {
        key: {
            schema: {
                type: 'string',
            },
        }
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
