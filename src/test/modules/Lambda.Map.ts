import { Lambda, ModuleCompute, ModuleDefinition } from '../../main/types/index.js';

type P = {
    array: unknown[];
    fn: Lambda<{ item: unknown; index: number }, unknown>;
};

type R = Promise<unknown[]>;

export const module: ModuleDefinition<P, R> = {
    moduleName: 'Lambda.Map',
    label: 'Lambda.Map',
    description: 'Executes a function for each array element and returns an array of results.',
    params: {
        array: {
            schema: {
                type: 'array',
                items: { type: 'any' },
            },
        },
        fn: {
            kind: 'lambda',
            schema: { type: 'any' },
            scope: {
                item: { type: 'any' },
                index: { type: 'number' },
            }
        }
    },
    result: {
        schema: {
            type: 'array',
            items: { type: 'any' },
        },
        async: true,
    },
};

export const compute: ModuleCompute<P, R> = async params => {
    const result: unknown[] = [];
    for (const [index, item] of params.array.entries()) {
        const res = await params.fn({ item, index });
        result.push(res);
    }
    return result;
};
