import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/index.js';
import { GraphEvalContext } from '../../main/runtime/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('Compiler: sync/async', () => {

    it('compiles sync function when the tree is sync (even if there are other async nodes)', async () => {
        const graph = await runtime.loadGraph({
            nodes: {
                p1: {
                    ref: 'Number',
                    props: {
                        value: { value: '42' },
                    }
                },
                res: {
                    ref: 'Math.Add',
                    props: {
                        a: { linkId: 'p1' },
                        b: { value: '1' },
                    }
                },
                id: {
                    ref: 'Promise',
                    props: {
                        value: { linkId: 'res' },
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileEsm(graph, { rootNodeId: 'res' });
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await compute({}, ctx);
        assert.strictEqual(res, 43);
        assert.strictEqual(/async\s+/.test(code), false);
        assert.strictEqual(/await\s+/.test(code), false);
    });

    it('compiles async function if one of the nodes is async', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                p1: {
                    ref: 'Number',
                    props: {
                        value: { value: '42' },
                    }
                },
                res: {
                    ref: 'Math.Add',
                    props: {
                        a: { linkId: 'p1' },
                        b: { value: '1' },
                    }
                },
                promise: {
                    ref: 'Promise',
                    props: {
                        value: { linkId: 'res' },
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileEsm(graph, { rootNodeId: 'promise' });
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await compute({}, ctx);
        assert.strictEqual(res, 43);
        assert.strictEqual(/async\s+/.test(code), true);
        assert.strictEqual(/await\s+/.test(code), true);
    });

    it('(regression) type conversion chaining works from sync to async', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                p1: {
                    ref: 'Number',
                    props: {
                        value: { value: '42' },
                    }
                },
                promise: {
                    ref: 'PromiseString',
                    props: {
                        value: { linkId: 'p1' },
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileEsm(graph, { rootNodeId: 'promise' });
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await compute({}, ctx);
        assert.strictEqual(res, '42');
    });

});
