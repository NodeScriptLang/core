import { Schema } from 'airtight';

import * as t from '../types/index.js';
import { NodeHooksSchema } from './node-hooks.js';
import { NodeMetadataSchema } from './node-metadata.js';

export const NodeDefSchema = new Schema<t.NodeDef>({
    id: 'NodeDef',
    type: 'object',
    properties: {
        metadata: NodeMetadataSchema.schema,
        compute: { type: 'any' },
        compile: { type: 'any', optional: true },
        hooks: {
            ...NodeHooksSchema.schema,
            optional: true,
        }
    },
});
