import { Schema } from '@flexent/schema';

import { GraphMetadata } from '../types/index.js';

export const GraphMetadataSchema = new Schema<GraphMetadata>({
    id: 'GraphMetadata',
    type: 'object',
    properties: {},
    additionalProperties: {
        type: 'any',
    },
});
