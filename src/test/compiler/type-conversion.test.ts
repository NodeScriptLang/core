import assert from 'assert';

import { GraphCompiler, GraphEvalContext } from '../../main/runtime/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('Compiler: type conversion', () => {

    it('converts types when schemas do not match', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Number',
                    props: {
                        value: { linkId: 'p' },
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
        const { code } = new GraphCompiler().compileComputeEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await compute({}, ctx);
        assert.strictEqual(res, 42);
    });

    it('does not convert types when schemas match', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Any',
                    props: {
                        value: { linkId: 'p' },
                    }
                },
                p: {
                    ref: '@system/Param',
                    props: {
                        key: { value: 'value' },
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileComputeEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res1 = await compute({ value: true }, ctx);
        assert.strictEqual(res1, true);
        const res2 = await compute({ value: 42 }, ctx);
        assert.strictEqual(res2, 42);
        const res3 = await compute({ value: { foo: 123 } }, ctx);
        assert.deepStrictEqual(res3, { foo: 123 });
    });

});
