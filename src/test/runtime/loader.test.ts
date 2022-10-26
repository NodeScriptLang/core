import assert from 'assert';

import { runtime } from '../runtime.js';
import { TestModuleLoader } from '../test-loader.js';

describe('ModuleLoader', () => {

    it('loads modules by moduleId', async () => {
        const loader = new TestModuleLoader();
        const def = await loader.loadModule('Math.Add');
        assert.deepStrictEqual(def, {
            moduleId: 'Math.Add',
            version: '1.0.0',
            label: 'Math.Add',
            labelParam: '',
            description: 'Computes a sum of two numbers.',
            keywords: ['math', 'add', 'plus', 'sum'],
            params: {
                a: { schema: { type: 'number' } },
                b: { schema: { type: 'number' } },
            },
            result: {
                schema: { type: 'number' }
            },
            cacheMode: 'auto',
            evalMode: 'auto',
            resizeMode: 'horizontal',
        });
    });

    it('loads all graph dependencies', async () => {
        const graph = await runtime.loadGraph({
            nodes: {
                a: { ref: 'Math.Add' },
                b: { ref: 'String' },
            },
        });
        assert.strictEqual(graph.loader.resolveModule('Math.Add').label, 'Math.Add');
        assert.strictEqual(graph.loader.resolveModule('String').label, 'String');
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
        assert.strictEqual(def.label, 'Math.Add');
    });

});
