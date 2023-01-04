import { Schema } from 'airtight';

import { ModuleParamHint } from '../types/module.js';

export const ModuleParamHintSchema = new Schema<ModuleParamHint>({
    type: 'object',
    properties: {
        keyof: { type: 'string', optional: true },
        pathof: { type: 'string', optional: true },
    }
});
