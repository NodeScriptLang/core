import assert from 'assert';

import { GraphLoader } from '../../main/runtime/loader.js';
import { runtime } from '../runtime.js';

describe('GraphLoader', () => {

    it('loads modules from URL', async () => {
        const loader = new GraphLoader();
        const def = await loader.loadNodeDef(runtime.defs['math.add']);
        assert.deepStrictEqual(def.label, 'Math.Add');
        assert.deepStrictEqual(def.category, []);
        assert.deepStrictEqual(def.description, 'Computes a sum of two numbers.');
        assert.deepStrictEqual(def.params, {
            a: { schema: { type: 'number' } },
            b: { schema: { type: 'number' } },
        });
        assert.deepStrictEqual(def.result, { type: 'number' });
        assert.strictEqual(typeof def.compute, 'function');
    });

    it('loads all graph dependencies', async () => {
        const loader = new GraphLoader();
        await loader.loadGraph({
            nodes: [
                { ref: 'n1' }
            ],
            refs: {
                'n1': runtime.defs['math.add'],
            }
        });
        const def = loader.resolveNodeDef(runtime.defs['math.add']);
        assert.deepStrictEqual(def.label, 'Math.Add');
        assert.strictEqual(typeof def.compute, 'function');
    });

    it('allows graph node to resolve definitions synchronously', async () => {
        const loader = new GraphLoader();
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
        const def = node!.$def;
        assert.deepStrictEqual(def.label, 'Math.Add');
        assert.strictEqual(typeof def.compute, 'function');
    });

});
