import { Schema } from 'airtight';

import { ModuleParamSpec } from '../types/index.js';
import { SchemaSpecSchema } from './SchemaSpec.js';

export const ModuleParamSpecSchema = new Schema<ModuleParamSpec>({
    id: 'ModuleParamSpec',
    type: 'object',
    properties: {
        label: {
            type: 'string',
            optional: true,
        },
        schema: SchemaSpecSchema.schema as any,
        deferred: {
            type: 'boolean',
            optional: true,
        },
        advanced: {
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
        attributes: {
            type: 'object',
            properties: {},
            additionalProperties: {
                type: 'any',
            }
        },
        minHeight: {
            type: 'number',
            optional: true,
        },
    }
});
