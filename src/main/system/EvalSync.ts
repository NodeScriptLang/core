import { ModuleDefinition } from '../types/index.js';

type P = {
    args: Record<string, unknown>;
    code: string;
};

type R = unknown;

export const EvalSync: ModuleDefinition<P, R> = {
    moduleName: '@system/EvalSync',
    version: '0.0.0',
    label: 'Eval',
    description: 'Evaluates synchronous JavaScript code with provided arguments.',
    keywords: ['eval', 'compute', 'js', 'javascript', 'function', 'execute', 'expression', 'sync'],
    resizeMode: 'all',
    params: {
        args: {
            schema: {
                type: 'object',
            },
            addItemLabel: 'Add argument',
            removeItemLabel: 'Remove argument',
        },
        code: {
            schema: {
                type: 'string',
            },
            hideSocket: true,
            renderer: 'javascript',
        }
    },
    result: {
        schema: {
            type: 'any',
        }
    },
};
