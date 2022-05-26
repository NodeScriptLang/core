import assert from 'assert';

import { GraphLoader } from '../main/runtime/loader.js';
import { runtime } from './runtime.js';

describe('GraphLoader', () => {

    it('loads modules from URL', async () => {
        const loader = new GraphLoader();
        const url = runtime.makeUrl('/out/test/nodes/math.add.js');
        const def = await loader.loadNodeDef(url);
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

});
