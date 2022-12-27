import { ModuleDefinition } from '../types/index.js';

type P = {
    args: Record<string, unknown>;
};

type R = unknown;

export const Subgraph: ModuleDefinition<P, R> = {
    moduleId: '@system/Subgraph',
    version: '0.0.0',
    label: 'Subgraph',
    description: 'Evaluates a subgraph with provided arguments.',
    keywords: ['function', 'subroutine'],
    hidden: true,
    params: {
        args: {
            schema: {
                type: 'object',
            },
            addItemLabel: 'Add argument',
            removeItemLabel: 'Remove argument',
        },
    },
    result: {
        schema: {
            type: 'any',
        }
    },
};
