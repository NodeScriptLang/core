import { Schema } from 'airtight';

import { ModuleResultSpec } from '../types/index.js';
import { DataSchemaSpecSchema } from './DataSchemaSpec.js';

export const ModuleResultSpecSchema = new Schema<ModuleResultSpec>({
    id: 'ModuleResultSpec',
    type: 'object',
    properties: {
        schema: DataSchemaSpecSchema.schema,
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
