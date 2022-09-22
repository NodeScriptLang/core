import { Schema } from 'airtight';

import { ModuleSpec } from '../types/index.js';
import { ModuleParamSpecSchema } from './ModuleParamSpec.js';
import { ModuleResultSpecSchema } from './ModuleResultSpec.js';
import { NodeCacheModeSchema } from './NodeCacheMode.js';
import { NodeEvalModeSchema } from './NodeEvalMode.js';
import { NodeResizeModeSchema } from './NodeResizeMode.js';

export const ModuleSpecSchema = new Schema<ModuleSpec>({
    id: 'ModuleSpec',
    type: 'object',
    properties: {
        label: {
            type: 'string',
        },
        labelParam: {
            type: 'string',
        },
        description: {
            type: 'string',
        },
        keywords: {
            type: 'string',
        },
        async: {
            type: 'boolean',
        },
        deprecated: {
            type: 'string',
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
        computeUrl: {
            type: 'string',
            optional: true,
        },
        bundleUrl: {
            type: 'string',
            optional: true,
        },
        sourceUrl: {
            type: 'string',
            optional: true,
        },
        exampleUrl: {
            type: 'string',
            optional: true,
        },
    }
});
