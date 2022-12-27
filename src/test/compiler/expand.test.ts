import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/index.js';
import { GraphEvalContext } from '../../main/runtime/index.js';
import { NodeResult } from '../../main/types/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('Compiler: array expansion', () => {

    it('expands a single property', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Math.Add',
                    props: {
                        a: { linkId: 'arr', expand: true },
                        b: { value: '1' },
                    }
                },
                arr: {
                    ref: 'Array',
                    props: {
                        items: {
                            entries: [
                                { value: '1' },
                                { value: '2' },
                                { value: '42' },
                            ]
                        }
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileComputeEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, [2, 3, 43]);
    });

    it('expands multiple properties, same array length', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Math.Add',
                    props: {
                        a: { linkId: 'arr', expand: true },
                        b: { linkId: 'arr', expand: true },
                    }
                },
                arr: {
                    ref: 'Array',
                    props: {
                        items: {
                            entries: [
                                { value: '1' },
                                { value: '2' },
                                { value: '42' },
                            ]
                        }
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileComputeEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, [2, 4, 84]);
    });

    it('expands multiple properties, different array lengths', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Math.Add',
                    props: {
                        a: { linkId: 'arr1', expand: true },
                        b: { linkId: 'arr2', expand: true },
                    }
                },
                arr1: {
                    ref: 'Array',
                    props: {
                        items: {
                            entries: [
                                { value: '1' },
                                { value: '2' },
                                { value: '42' },
                            ]
                        }
                    }
                },
                arr2: {
                    ref: 'Array',
                    props: {
                        items: {
                            entries: [
                                { value: '2' },
                                { value: '3' },
                            ]
                        }
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileComputeEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, [3, 5]);
    });

    it('supports entries', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Object',
                    props: {
                        properties: {
                            entries: [
                                { key: 'foo', linkId: 'arr1', expand: true },
                                { key: 'bar', linkId: 'arr2' },
                                { key: 'baz', value: '42' },
                            ]
                        }
                    }
                },
                arr1: {
                    ref: 'Array',
                    props: {
                        items: {
                            entries: [
                                { value: 'one' },
                                { value: 'two' },
                                { value: 'three' },
                            ]
                        }
                    }
                },
                arr2: {
                    ref: 'Array',
                    props: {
                        items: {
                            entries: [
                                { value: '1' },
                                { value: '2' },
                            ]
                        }
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileComputeEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, [
            { foo: 'one', bar: [1, 2], baz: 42 },
            { foo: 'two', bar: [1, 2], baz: 42 },
            { foo: 'three', bar: [1, 2], baz: 42 },
        ]);
    });

    it('converts non-arrays to single-element array', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Math.Add',
                    props: {
                        a: { value: '2', expand: true },
                        b: { linkId: 'p', expand: true },
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
        assert.deepStrictEqual(res, [44]);
    });

    it('emits progress', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Any',
                    props: {
                        value: { linkId: 'arr', expand: true },
                    }
                },
                arr: {
                    ref: 'Array',
                    props: {
                        items: {
                            entries: [
                                { value: '1' },
                                { value: '2' },
                                { value: '42' },
                            ]
                        }
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
        assert.deepStrictEqual(res, [1, 2, 42]);
        assert.deepStrictEqual(results, [
            { nodeId: 'res', progress: 0 },
            { nodeId: 'arr', progress: 0 },
            { nodeId: 'arr', result: [1, 2, 42] },
            { nodeId: 'res', progress: 0 },
            { nodeId: 'res', progress: 1 / 3 },
            { nodeId: 'res', progress: 2 / 3 },
            { nodeId: 'res', result: [1, 2, 42] },
        ]);
    });

});
