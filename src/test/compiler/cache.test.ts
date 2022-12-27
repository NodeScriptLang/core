import assert from 'assert';

import { GraphCompiler, GraphEvalContext } from '../../main/runtime/index.js';
import { NodeResult } from '../../main/types/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('Compiler: cache', () => {

    it('does not evaluate same node twice if its result is used more than once', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Math.Add',
                    props: {
                        a: { linkId: 'p' },
                        b: { linkId: 'p' },
                    }
                },
                p: {
                    ref: 'String',
                    props: {
                        value: { value: '42' },
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileComputeEsm(graph, { introspect: true });
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const results: NodeResult[] = [];
        ctx.nodeEvaluated.on(_ => results.push(_));
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, 84);
        assert.deepStrictEqual(results, [
            { nodeId: 'res', progress: 0 },
            { nodeId: 'p', progress: 0 },
            { nodeId: 'p', result: '42' },
            { nodeId: 'res', result: 84 },
        ]);
        assert.deepStrictEqual(ctx.cache.size, 1);
        assert.deepStrictEqual(ctx.cache.get('p'), { result: '42' });
    });

    it('does not cache node when its result is only used once', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Math.Add',
                    props: {
                        a: { linkId: 'p' },
                        b: { value: '12' },
                    }
                },
                p: {
                    ref: 'String',
                    props: {
                        value: { value: '42' },
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileComputeEsm(graph, { introspect: true });
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const results: NodeResult[] = [];
        ctx.nodeEvaluated.on(_ => results.push(_));
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, 54);
        assert.deepStrictEqual(results, [
            { nodeId: 'res', progress: 0 },
            { nodeId: 'p', progress: 0 },
            { nodeId: 'p', result: '42' },
            { nodeId: 'res', result: 54 },
        ]);
        assert.deepStrictEqual(ctx.cache.size, 0);
    });

});
