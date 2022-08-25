import { Schema } from 'airtight';

import * as t from '../types/index.js';
import { DataSchemaSchema } from './data-schema.js';

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
            type: 'string',
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
        renderer: {
            type: 'string',
            optional: true,
        }
    }
});
