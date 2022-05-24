import { Schema } from 'airtight';

export type Point = { x: number; y: number };

export const PointSchema = new Schema<Point>({
    id: 'Point',
    type: 'object',
    properties: {
        x: { type: 'number' },
        y: { type: 'number' },
    },
    default: { x: 0, y: 0 },
});

export const Point = {

    ZERO: { x: 0, y: 0 },

    add(a: Point, b: Point): Point {
        return {
            x: a.x + b.x,
            y: a.y + b.y,
        };
    },

    scale(p: Point, fac: number) {
        return {
            x: p.x * fac,
            y: p.y * fac,
        };
    }

};
