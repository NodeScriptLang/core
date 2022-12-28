import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/GraphCompiler.js';
import { GraphEvalContext } from '../../main/runtime/GraphEvalContext.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('EvalJson', () => {

    it('returns hardcoded json', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: '@system/EvalJson',
                    props: {
                        code: {
                            value: '{ "foo": { "bar": 42 }, "bar": [1, 2, 3] }',
                        }
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = compute({}, ctx);
        assert.deepStrictEqual(res, { 'foo': { 'bar': 42 }, 'bar': [1, 2, 3] });
    });

});
