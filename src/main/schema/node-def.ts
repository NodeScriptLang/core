import { Schema } from 'airtight';

import * as t from '../types/index.js';
import { NodeMetadataSchema } from './node-metadata.js';

export const NodeDefSchema = new Schema<t.NodeDef>({
    id: 'NodeDef',
    type: 'object',
    properties: {
        metadata: NodeMetadataSchema.schema,
        compute: { type: 'any' },
    },
});
