import { Lambda, Operator } from '../../main/types/index.js';

export const node: Operator<{
    array: unknown[];
    fn: Lambda<{ item: unknown; index: number }, unknown>;
}, Promise<unknown[]>> = {
    metadata: {
        label: 'Lambda.Map',
        description: 'Executes a function for each array element and returns an array of results.',
        async: true,
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
            type: 'array',
            items: { type: 'any' },
        },
    },
    async compute(params) {
        const result: unknown[] = [];
        for (const [index, item] of params.array.entries()) {
            const res = await params.fn({ item, index });
            result.push(res);
        }
        return result;
    }
};
