import assert from 'assert';

import { GraphCompiler } from '../../main/runtime/GraphCompiler.js';
import { GraphEvalContext } from '../../main/runtime/GraphEvalContext.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('EvalAsync', () => {

    it('evaluates async javascript', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Math.Add',
                    props: [
                        { key: 'a', linkId: 'e1' },
                        { key: 'b', linkId: 'e2' },
                    ]
                },
                e1: {
                    ref: '@system/EvalAsync',
                    props: [
                        {
                            key: 'code',
                            value: 'return await new Promise(r => r(42))',
                        }
                    ]
                },
                e2: {
                    ref: '@system/EvalAsync',
                    props: [
                        {
                            key: 'code',
                            value: 'return await new Promise(r => r(1))',
                        }
                    ]
                }
            }
        });
        const { code } = new GraphCompiler().compileComputeEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await compute({}, ctx);
        assert.strictEqual(res, 43);
    });

    it('supports arguments', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                s1: {
                    ref: 'String',
                    props: [
                        { key: 'value', value: 'hello' },
                    ]
                },
                s2: {
                    ref: 'String',
                    props: [
                        { key: 'value', value: 'world' },
                    ]
                },
                res: {
                    ref: '@system/EvalAsync',
                    props: [
                        {
                            key: 'code',
                            value: 'return await new Promise(r => r(a + b))',
                        },
                        {
                            key: 'args',
                            entries: [
                                { key: 'a', linkId: 's1' },
                                { key: 'b', linkId: 's2' },
                            ]
                        }
                    ]
                }
            }
        });
        const { code } = new GraphCompiler().compileComputeEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await compute({}, ctx);
        assert.strictEqual(res, 'helloworld');
    });

});
