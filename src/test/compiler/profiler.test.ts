import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/index.js';
import { GraphEvalContext, InMemoryGraphProfiler } from '../../main/runtime/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('Compiler: profiler', () => {

    it('captures profile spans', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'a',
            nodes: {
                a: {
                    ref: 'Math.Add',
                    props: {
                        a: { linkId: 'b' },
                        b: { linkId: 'c' },
                    }
                },
                b: {
                    ref: 'Math.Add',
                    props: {
                        a: { linkId: 'c' },
                        b: { linkId: 'c' },
                    }
                },
                c: {
                    ref: 'Math.Add',
                    props: {
                        a: { value: '1' },
                        b: { value: '2' },
                    }
                },
            },
        });
        const { code } = new GraphCompiler().compileEsm(graph);
        const { compute } = await evalEsmModule(code);
        const profiler = new InMemoryGraphProfiler();
        const ctx = new GraphEvalContext();
        ctx.profiler = profiler;
        const res = compute({}, ctx);
        assert.strictEqual(res, 9);
        assert.deepStrictEqual(profiler.spans.map(span => [span[0], span[1]]), [
            ['s', 'root:a'],
            ['s', 'root:b'],
            ['s', 'root:c'],
            ['c', 'root:c'],
            ['e', 'root:c'],
            ['c', 'root:b'],
            ['e', 'root:b'],
            ['c', 'root:a'],
            ['e', 'root:a'],
        ]);
    });

});
