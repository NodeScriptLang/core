import assert from 'assert';

import { runtime } from '../runtime.js';
import { TestGraphLoader } from '../test-loader.js';

describe('GraphLoader', () => {

    it('loads modules from URL', async () => {
        const loader = new TestGraphLoader();
        const def = await loader.loadModule(runtime.defs['math.add']);
        assert.deepStrictEqual(def, {
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
        const loader = new TestGraphLoader();
        await loader.loadGraph({
            nodes: [
                { ref: 'n1' }
            ],
            refs: {
                'n1': runtime.defs['math.add'],
            }
        });
        const def = loader.resolveModule(runtime.defs['math.add']);
        assert.strictEqual(def.label, 'Math.Add');
    });

    it('allows graph node to resolve module definitions synchronously', async () => {
        const loader = new TestGraphLoader();
        const graph = await loader.loadGraph({
            nodes: [
                {
                    id: 'node1',
                    ref: 'n1',
                    props: [
                        { key: 'a', value: '12' },
                        { key: 'b', value: '21' },
                    ]
                }
            ],
            refs: {
                'n1': runtime.defs['math.add'],
            }
        });
        const node = graph.getNodeById('node1');
        const def = node!.$module;
        assert.strictEqual(def.label, 'Math.Add');
    });

});
