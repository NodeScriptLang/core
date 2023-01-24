import { Schema } from 'airtight';

import { ModuleResultSpec } from '../types/index.js';
import { SchemaSpecSchema } from './SchemaSpec.js';

export const ModuleResultSpecSchema = new Schema<ModuleResultSpec>({
    id: 'ModuleResultSpec',
    type: 'object',
    properties: {
        schema: SchemaSpecSchema.schema,
        async: {
            type: 'boolean',
            optional: true,
        },
        hideSocket: {
            type: 'boolean',
            optional: true,
        },
    }
});
