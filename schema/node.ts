import { Schema } from '@airtight';
import * as t from '~/types/mod.ts';
import { IdSchema, shortId } from '~/util/id.ts';
import { PointSchema } from '~/util/point.ts';

import { PropSchema } from './prop.ts';

export const NodeSchema = new Schema<t.Node>({
    id: 'Node',
    type: 'object',
    properties: {
        id: { ...IdSchema.schema, default: () => shortId() },
        ref: { type: 'string' },
        pos: PointSchema.schema,
        w: { type: 'integer', default: 5, minimum: 3, maximum: 20 },
        collapsed: { type: 'boolean' },
        props: {
            type: 'array',
            items: PropSchema.schema,
        },
    }
});
