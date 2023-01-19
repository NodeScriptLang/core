import assert from 'assert';

import { runtime } from './runtime.js';
import { TestModuleLoader } from './test-loader.js';

describe('ModuleLoader', () => {

    it('loads modules by ref', async () => {
        const loader = new TestModuleLoader();
        const def = await loader.loadModule('Math.Add');
        assert.deepStrictEqual(def, {
            moduleName: 'Math.Add',
            version: '1.0.0',
            labelParam: '',
            description: 'Computes a sum of two numbers.',
            keywords: ['math', 'add', 'plus', 'sum'],
            params: {
                a: {
                    schema: { type: 'number' },
                    attributes: {},
                },
                b: {
                    schema: { type: 'number' },
                    attributes: {},
                },
            },
            result: {
                schema: { type: 'number' }
            },
            cacheMode: 'auto',
            evalMode: 'auto',
            resizeMode: 'horizontal',
            attributes: {},
        });
    });

    it('loads all graph dependencies', async () => {
        const graph = await runtime.loadGraph({
            nodes: {
                a: { ref: 'Math.Add' },
                b: { ref: 'String' },
            },
        });
        assert.strictEqual(graph.loader.resolveModule('Math.Add').moduleName, 'Math.Add');
        assert.strictEqual(graph.loader.resolveModule('String').moduleName, 'String');
    });

    it('allows graph node to resolve module definitions synchronously', async () => {
        const graph = await runtime.loadGraph({
            nodes: {
                node1: {
                    ref: 'Math.Add',
                    props: {
                        a: { value: '12' },
                        b: { value: '21' },
                    }
                }
            },
        });
        const node = graph.getNodeById('node1');
        const def = node!.getModuleSpec();
        assert.strictEqual(def.moduleName, 'Math.Add');
    });

});
