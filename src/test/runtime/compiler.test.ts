import assert from 'assert';

import { GraphCompiler } from '../../main/runtime/compiler.js';
import { GraphEvalContext } from '../../main/runtime/ctx.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('GraphCompiler', () => {

    it('emits ESM code', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: [
                {
                    id: 'res',
                    ref: 'add',
                    props: [
                        { key: 'a', value: '12' },
                        { key: 'b', value: '21' },
                    ]
                }
            ],
            refs: {
                add: runtime.defs['math.add'],
            }
        });
        const code = new GraphCompiler().compileEsm(graph);
        const { node } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await node.compute({}, ctx);
        assert.strictEqual(res, 33);
    });

});
