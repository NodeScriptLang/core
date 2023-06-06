import { Schema } from 'airtight';

import { NodeSpec } from '../types/index.js';
import { NodeMetadataSchema } from './NodeMetadata.js';
import { PropSpecSchema } from './PropSpec.js';
import { SubgraphSpecSchema } from './SubgraphSpec.js';

export const NodeSpecSchema = new Schema<NodeSpec>({
    id: 'NodeSpec',
    type: 'object',
    properties: {
        ref: { type: 'string' },
        props: {
            type: 'object',
            properties: {},
            additionalProperties: PropSpecSchema.schema,
        },
        metadata: NodeMetadataSchema.schema,
        subgraph: {
            ...SubgraphSpecSchema.schema,
            optional: true,
        },
    },
});
