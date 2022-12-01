import { Schema } from '@nodescript/schema';

import { ModuleParamSpec } from '../types/index.js';
import { DataSchemaSpecSchema } from './DataSchemaSpec.js';

export const ModuleParamSpecSchema = new Schema<ModuleParamSpec>({
    id: 'ModuleParamSpec',
    type: 'object',
    properties: {
        label: {
            type: 'string',
            optional: true,
        },
        schema: DataSchemaSpecSchema.schema as any,
        deferred: {
            type: 'boolean',
            optional: true,
        },
        addItemLabel: {
            type: 'string',
            optional: true,
        },
        removeItemLabel: {
            type: 'string',
            optional: true,
        },
        keyPlaceholder: {
            type: 'string',
            optional: true,
        },
        valuePlaceholder: {
            type: 'string',
            optional: true,
        },
        hideEntries: {
            type: 'boolean',
            optional: true,
        },
        hideValue: {
            type: 'boolean',
            optional: true,
        },
        hideSocket: {
            type: 'boolean',
            optional: true,
        },
        renderer: {
            type: 'string',
            optional: true,
        },
        attributes: {
            type: 'object',
            properties: {},
            additionalProperties: {
                type: 'any',
            }
        }
    }
});
