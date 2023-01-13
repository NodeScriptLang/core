import { Schema } from 'airtight';

import { ModuleSpec } from '../types/index.js';
import { ModuleIdSchema } from './ModuleId.js';
import { ModuleParamSpecSchema } from './ModuleParamSpec.js';
import { ModuleResultSpecSchema } from './ModuleResultSpec.js';
import { ModuleVersionSchema } from './ModuleVersion.js';
import { NodeCacheModeSchema } from './NodeCacheMode.js';
import { NodeEvalModeSchema } from './NodeEvalMode.js';
import { NodeResizeModeSchema } from './NodeResizeMode.js';

export const ModuleSpecSchema = new Schema<ModuleSpec>({
    id: 'ModuleSpec',
    type: 'object',
    properties: {
        moduleId: ModuleIdSchema.schema,
        version: ModuleVersionSchema.schema,
        label: {
            type: 'string',
        },
        labelParam: {
            type: 'string',
        },
        namespace: {
            type: 'string',
            optional: true,
        },
        icon: {
            type: 'string',
            optional: true,
        },
        description: {
            type: 'string',
        },
        keywords: {
            type: 'array',
            items: { type: 'string' },
        },
        deprecated: {
            type: 'string',
            optional: true,
        },
        hidden: {
            type: 'boolean',
            optional: true,
        },
        params: {
            type: 'object',
            properties: {},
            additionalProperties: ModuleParamSpecSchema.schema,
        },
        result: ModuleResultSpecSchema.schema,
        cacheMode: NodeCacheModeSchema.schema,
        evalMode: NodeEvalModeSchema.schema,
        resizeMode: NodeResizeModeSchema.schema,
        attributes: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        }
    }
});
