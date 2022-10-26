import { ModuleCompute, ModuleDefinition } from '../../main/types/index.js';

type P = {
    a: number;
    b: number;
};

type R = number;

export const module: ModuleDefinition<P, R> = {
    moduleId: 'Math.Add',
    version: '1.0.0',
    label: 'Math.Add',
    description: 'Computes a sum of two numbers.',
    keywords: ['math', 'add', 'plus', 'sum'],
    params: {
        a: {
            schema: {
                type: 'number'
            }
        },
        b: {
            schema: {
                type: 'number'
            }
        }
    },
    result: {
        schema: {
            type: 'number',
        },
    },
};

export const compute: ModuleCompute<P, R> = params => {
    return params.a + params.b;
};
