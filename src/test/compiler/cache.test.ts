import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/index.js';
import { GraphEvalContext } from '../../main/runtime/index.js';
import { NodeResult } from '../../main/types/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { omit } from '../helpers.js';
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
        const { code } = new GraphCompiler().compileEsm(graph, { introspect: true });
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const results: NodeResult[] = [];
        ctx.nodeEvaluated.on(_ => results.push(omit(_, 'timestamp')));
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, 84);
        assert.deepStrictEqual(results, [
            { nodeUid: 'root:res', progress: 0 },
            { nodeUid: 'root:p', progress: 0 },
            { nodeUid: 'root:p', result: '42' },
            { nodeUid: 'root:res', result: 84 },
        ]);
        assert.deepStrictEqual(ctx.cache.size, 1);
        assert.deepStrictEqual(ctx.cache.get('root:p'), { res: '42' });
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
        const { code } = new GraphCompiler().compileEsm(graph, { introspect: true });
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const results: NodeResult[] = [];
        ctx.nodeEvaluated.on(_ => results.push(omit(_, 'timestamp')));
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, 54);
        assert.deepStrictEqual(results, [
            { nodeUid: 'root:res', progress: 0 },
            { nodeUid: 'root:p', progress: 0 },
            { nodeUid: 'root:p', result: '42' },
            { nodeUid: 'root:res', result: 54 },
        ]);
        assert.deepStrictEqual(ctx.cache.size, 0);
    });

});
