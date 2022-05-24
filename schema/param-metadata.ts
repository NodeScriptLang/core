import { Schema } from '@airtight';
import * as t from '~/types/mod.ts';

import { DataSchemaSchema } from './data-schema.ts';

export const ParamMetadataSchema = new Schema<t.ParamMetadata>({
    id: 'ParamDef',
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
        schema: DataSchemaSchema.schema as any,
        scope: {
            type: 'object',
            properties: {},
            additionalProperties: DataSchemaSchema.schema,
            optional: true,
        },
        default: {
            type: 'any',
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
    }
});
