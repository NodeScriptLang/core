import { ModuleDefinition } from '../types/index.js';

type P = {
    code: string;
};

type R = unknown;

export const EvalJson: ModuleDefinition<P, R> = {
    moduleName: '@system/EvalJson',
    label: 'Json',
    description: 'Returns a JSON value.',
    keywords: ['eval', 'json', 'data'],
    resizeMode: 'all',
    params: {
        code: {
            schema: {
                type: 'string',
            },
            hideSocket: true,
            renderer: 'json',
        }
    },
    result: {
        schema: {
            type: 'any',
        }
    },
    attributes: {
        edgeUxRole: 'Json',
    }
};
