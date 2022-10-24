import { ModuleDefinition } from '../types/index.js';

type P = {
    args: Record<string, unknown>;
    code: string;
};

type R = Promise<unknown>;

export const EvalAsync: ModuleDefinition<P, R> = {
    moduleName: '@system/EvalAsync',
    version: '0.0.0',
    label: 'Eval Async',
    description: 'Evaluates asynchronous JavaScript code with provided arguments.',
    keywords: ['eval', 'compute', 'js', 'javascript', 'function', 'execute', 'expression', 'async'],
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
        async: true,
        schema: {
            type: 'any',
        }
    },
};
