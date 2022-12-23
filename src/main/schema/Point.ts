import { Schema } from 'airtight';

import { Point } from '../types/point.js';

export const PointSchema = new Schema<Point>({
    id: 'Point',
    type: 'object',
    properties: {
        x: { type: 'number' },
        y: { type: 'number' },
    },
    default: { x: 0, y: 0 },
});
