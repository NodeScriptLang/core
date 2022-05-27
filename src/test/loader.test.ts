import assert from 'assert';

import { GraphLoader } from '../main/runtime/loader.js';
import { runtime } from './runtime.js';

const nodeUrls = {
    'math.add': runtime.makeUrl('/out/test/nodes/math.add.js'),
};

describe('GraphLoader', () => {

    it('loads modules from URL', async () => {
        const loader = new GraphLoader();
        const def = await loader.loadNodeDef(nodeUrls['math.add']);
        assert.deepStrictEqual(def.label, 'Math.Add');
        assert.deepStrictEqual(def.category, []);
        assert.deepStrictEqual(def.description, '');
        assert.deepStrictEqual(def.params, {
            a: { schema: { type: 'number' } },
            b: { schema: { type: 'number' } },
        });
        assert.deepStrictEqual(def.returns, { type: 'number' });
        assert.strictEqual(typeof def.compute, 'function');
    });

    it('loads all graph dependencies', async () => {
        const loader = new GraphLoader();
        await loader.loadGraph({
            nodes: [
                { ref: 'n1' }
            ],
            refs: {
                'n1': nodeUrls['math.add'],
            }
        });
        const def = loader.resolveNodeDef(nodeUrls['math.add']);
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
                'n1': nodeUrls['math.add'],
            }
        });
        const node = graph.getNodeById('node1');
        const def = node!.$def;
        assert.deepStrictEqual(def.label, 'Math.Add');
        assert.strictEqual(typeof def.compute, 'function');
    });

});
