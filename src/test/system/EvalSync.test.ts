import assert from 'assert';

import { GraphCompiler } from '../../main/runtime/GraphCompiler.js';
import { GraphEvalContext } from '../../main/runtime/GraphEvalContext.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('EvalSync', () => {

    it('evaluates sync javascript', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Math.Add',
                    props: {
                        a: { linkId: 'e1' },
                        b: { linkId: 'e2' },
                    }
                },
                e1: {
                    ref: '@system/EvalSync',
                    props: {
                        code: {
                            value: 'return 42',
                        }
                    }
                },
                e2: {
                    ref: '@system/EvalSync',
                    props: {
                        code: {
                            value: 'return 1',
                        }
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileComputeEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = compute({}, ctx);
        assert.strictEqual(res, 43);
    });

    it('supports arguments', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                s1: {
                    ref: 'String',
                    props: {
                        value: { value: 'hello' },
                    }
                },
                s2: {
                    ref: 'String',
                    props: {
                        value: { value: 'world' },
                    }
                },
                res: {
                    ref: '@system/EvalSync',
                    props: {
                        code: {
                            value: 'return a + b',
                        },
                        args: {
                            entries: [
                                { key: 'a', linkId: 's1' },
                                { key: 'b', linkId: 's2' },
                            ]
                        }
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileComputeEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = compute({}, ctx);
        assert.strictEqual(res, 'helloworld');
    });

    it('supports expansions', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                s1: {
                    ref: 'Array',
                    props: {
                        items: {
                            entries: [
                                { value: 'one' },
                                { value: 'two' },
                                { value: 'three' },
                            ]
                        },
                    }
                },
                s2: {
                    ref: 'Array',
                    props: {
                        items: {
                            entries: [
                                { value: '1' },
                                { value: '2' },
                                { value: '3' },
                            ]
                        },
                    }
                },
                res: {
                    ref: '@system/EvalSync',
                    props: {
                        code: {
                            value: 'return a + b',
                        },
                        args: {
                            entries: [
                                { key: 'a', linkId: 's1', expand: true },
                                { key: 'b', linkId: 's2', expand: true },
                            ]
                        }
                    }
                }
            }
        });
        const { code } = new GraphCompiler().compileComputeEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = compute({}, ctx);
        assert.deepStrictEqual(res, [
            'one1',
            'two2',
            'three3',
        ]);
    });

});
