import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export const Scope = ModuleSpecSchema.create({
    moduleName: 'Scope',
    version: '1.0.0',
    keywords: ['system'],
    description: 'Returns the current scope or an empty object',
    deprecated: '',
    params: {},
    result: {
        schema: { type: 'object' },
        async: false,
    },
    newScope: false,
    cacheMode: 'auto',
    evalMode: 'auto'
}); 
