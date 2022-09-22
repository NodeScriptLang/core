import { Schema } from 'airtight';

import { ModuleParamSpec } from '../types/index.js';
import { DataSchemaSpecSchema } from './DataSchemaSpec.js';

export const ModuleParamSpecSchema = new Schema<ModuleParamSpec>({
    id: 'ModuleParamSpec',
    type: 'object',
    properties: {
        kind: {
            type: 'string',
            enum: ['lambda'],
            optional: true,
        },
        label: {
            type: 'string',
            optional: true,
        },
        schema: DataSchemaSpecSchema.schema as any,
        scope: {
            type: 'object',
            properties: {},
            additionalProperties: DataSchemaSpecSchema.schema,
            optional: true,
        },
        default: {
            type: 'string',
        },
        addItemLabel: {
            type: 'string',
        },
        removeItemLabel: {
            type: 'string',
        },
        keyPlaceholder: {
            type: 'string',
        },
        valuePlaceholder: {
            type: 'string',
        },
        hideEntries: {
            type: 'boolean',
        },
        hideValue: {
            type: 'boolean',
        },
        hideSocket: {
            type: 'boolean',
        },
        renderer: {
            type: 'string',
            optional: true,
        },
    }
});
