import { Schema } from 'airtight';

import { ModuleSubgraphSpec } from '../types/index.js';
import { ModuleParamSpecSchema } from './ModuleParamSpec.js';

export const ModuleSubgraphSpecSchema = new Schema<ModuleSubgraphSpec>({
    id: 'ModuleSubgraphSpec',
    type: 'object',
    properties: {
        input: {
            type: 'object',
            properties: {},
            additionalProperties: ModuleParamSpecSchema.schema,
        },
        output: {
            type: 'object',
            properties: {},
            additionalProperties: ModuleParamSpecSchema.schema,
        },
    }
});
