import { Schema } from 'airtight';

import { ModuleSubgraphSpec } from '../types/index.js';
import { SchemaSpecSchema } from './SchemaSpec.js';

export const ModuleSubgraphSpecSchema = new Schema<ModuleSubgraphSpec>({
    id: 'ModuleSubgraphSpec',
    type: 'object',
    properties: {
        input: {
            type: 'object',
            properties: {},
            additionalProperties: SchemaSpecSchema.schema,
        },
        output: SchemaSpecSchema.schema,
    }
});
