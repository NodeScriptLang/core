import { Schema } from 'airtight';

import { ModuleSpec } from '../types/index.js';
import { ModuleNameSchema } from './ModuleName.js';
import { ModuleParamSpecSchema } from './ModuleParamSpec.js';
import { ModuleResultSpecSchema } from './ModuleResultSpec.js';
import { ModuleSubgraphSpecSchema } from './ModuleSubgraphSpec.js';
import { ModuleVersionSchema } from './ModuleVersion.js';
import { NodeCacheModeSchema } from './NodeCacheMode.js';
import { NodeEvalModeSchema } from './NodeEvalMode.js';
import { NodeResizeModeSchema } from './NodeResizeMode.js';

export const ModuleSpecSchema = new Schema<ModuleSpec>({
    id: 'ModuleSpec',
    type: 'object',
    properties: {
        moduleName: ModuleNameSchema.schema,
        version: ModuleVersionSchema.schema,
        labelParam: {
            type: 'string',
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
        sourceUrl: {
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
        subgraph: {
            ...ModuleSubgraphSpecSchema.schema,
            optional: true,
        },
        newScope: {
            type: 'boolean',
            default: false,
        },
        cacheMode: NodeCacheModeSchema.schema,
        evalMode: NodeEvalModeSchema.schema,
        resizeMode: NodeResizeModeSchema.schema,
        hideEvalControls: {
            type: 'boolean',
            default: false,
        },
        attributes: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        },
    }
});
