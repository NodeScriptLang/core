import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/index.js';
import { GraphEvalContext } from '../../main/runtime/index.js';
import { NodeResult } from '../../main/types/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('Compiler: basics', () => {

    it('emits ESM code', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Math.Add',
                    props: {
                        a: { value: '12' },
                        b: { value: '21' },
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileComputeEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = compute({}, ctx);
        assert.strictEqual(res, 33);
    });

    it('supports introspection', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                p1: {
                    ref: '@system/Param',
                    props: {
                        key: { value: 'value' },
                    }
                },
                res: {
                    ref: 'Math.Add',
                    props: {
                        a: { linkId: 'p1' },
                        b: { value: '21' },
                    }
                }
            }
        });
        const { code } = new GraphCompiler().compileComputeEsm(graph, {
            introspect: true,
        });
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const nodeResults: NodeResult[] = [];
        ctx.nodeEvaluated.on(_ => nodeResults.push(_));
        const res = await compute({
            value: 12
        }, ctx);
        assert.strictEqual(res, 33);
        assert.deepStrictEqual(nodeResults, [
            { nodeId: 'res', progress: 0 },
            { nodeId: 'p1', progress: 0 },
            { nodeId: 'p1', result: 12 },
            { nodeId: 'res', result: 33 },
        ]);
    });

    describe('params', () => {

        it('supports param nodes', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    p1: {
                        ref: '@system/Param',
                        props: {
                            key: { value: 'value' },
                        }
                    },
                    res: {
                        ref: 'Math.Add',
                        props: {
                            a: { linkId: 'p1' },
                            b: { value: '1' },
                        }
                    }
                },
            });
            const { code } = new GraphCompiler().compileComputeEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({
                value: 42
            }, ctx);
            assert.strictEqual(res, 43);
        });

        it('emits params in the order they appear in the graph', async () => {
            const createGraph = (aPos: any, bPos: any) => runtime.loadGraph({
                rootNodeId: 'res',
                moduleSpec: {
                    params: {
                        b: { schema: { type: 'number' } },
                        a: { schema: { type: 'number' } },
                    }
                },
                nodes: {
                    p1: {
                        ref: '@system/Param',
                        props: {
                            key: { value: 'a' },
                        },
                        metadata: {
                            pos: aPos,
                        }
                    },
                    p2: {
                        ref: '@system/Param',
                        props: {
                            key: { value: 'b' },
                        },
                        metadata: {
                            pos: bPos,
                        }
                    },
                    res: {
                        ref: 'Math.Add',
                        props: {
                            a: { linkId: 'p1' },
                            b: { linkId: 'p2' },
                        }
                    }
                },
            });
            const graph1 = await createGraph({ x: 4, y: 3 }, { x: 4, y: 4 }); // a above b
            const res1 = new GraphCompiler().compileComputeEsm(graph1);
            assert.deepStrictEqual(Object.keys(res1.moduleSpec.params), ['a', 'b']);
            const graph2 = await createGraph({ x: 4, y: 5 }, { x: 4, y: 4 }); // a below b
            const res2 = new GraphCompiler().compileComputeEsm(graph2);
            assert.deepStrictEqual(Object.keys(res2.moduleSpec.params), ['b', 'a']);
            const graph3 = await createGraph({ x: 3, y: 4 }, { x: 4, y: 4 }); // a to the left b
            const res3 = new GraphCompiler().compileComputeEsm(graph3);
            assert.deepStrictEqual(Object.keys(res3.moduleSpec.params), ['a', 'b']);
            const graph4 = await createGraph({ x: 5, y: 4 }, { x: 4, y: 4 }); // a to the right b
            const res4 = new GraphCompiler().compileComputeEsm(graph4);
            assert.deepStrictEqual(Object.keys(res4.moduleSpec.params), ['b', 'a']);
        });

    });

    describe('result', () => {

        it('returns value unmodified by default', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    p: {
                        ref: 'String',
                        props: {
                            value: { value: '123' },
                        }
                    },
                    res: {
                        ref: '@system/Result',
                        props: {
                            value: { linkId: 'p' },
                        }
                    }
                },
            });
            const { code } = new GraphCompiler().compileComputeEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.strictEqual(res, '123');
        });

        it('converts value as per graph result schema', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                moduleSpec: {
                    result: {
                        schema: { type: 'number' },
                    }
                },
                nodes: {
                    p: {
                        ref: 'String',
                        props: {
                            value: { value: '123' },
                        }
                    },
                    res: {
                        ref: '@system/Result',
                        props: {
                            value: { linkId: 'p' },
                        }
                    }
                },
            });
            const { code } = new GraphCompiler().compileComputeEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.strictEqual(res, 123);
        });

    });

});
