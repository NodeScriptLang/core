import assert from 'assert';

import { GraphCompiler, GraphEvalContext } from '../../main/runtime/index.js';
import * as t from '../../main/types/index.js';
import { codeToUrl, evalEsmModule } from '../../main/util/index.js';
import { runtime } from '../runtime.js';
import { TestGraphLoader } from '../test-loader.js';

describe('GraphCompiler', () => {

    describe('basics', () => {

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
            const nodeResults: t.NodeResult[] = [];
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

    });

    describe('custom graphs', () => {

        it('can compile graph and use it as a node', async () => {
            const loader = new TestGraphLoader();
            const graph1 = await loader.loadGraph({
                moduleSpec: {
                    params: {
                        val: {
                            schema: { type: 'number' },
                        }
                    },
                    result: {
                        schema: {
                            type: 'number',
                        }
                    },
                },
                rootNodeId: 'res',
                nodes: {
                    p1: {
                        ref: '@system/Param',
                        props: {
                            key: { value: 'val' },
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
            const { code: code1 } = new GraphCompiler().compileComputeEsm(graph1);
            graph1.moduleSpec.attributes = {
                customImportUrl: codeToUrl(code1),
            };
            loader.defineModule('graph1', graph1.moduleSpec);
            const graph = await loader.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    res: {
                        ref: 'graph1',
                        props: {
                            val: { value: '123' },
                        }
                    }
                },
            });
            const { code: code2 } = new GraphCompiler().compileComputeEsm(graph);
            const { compute } = await evalEsmModule(code2);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.strictEqual(res, 124);
        });
    });

    describe('type conversion', () => {

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

    describe('entries', () => {

        it('supports object entries', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    res: {
                        ref: 'Object',
                        props: {
                            properties: {
                                entries: [
                                    { key: 'foo', value: '42' },
                                    { key: 'bar', linkId: 'num' },
                                ]
                            },
                        }
                    },
                    num: {
                        ref: 'Number',
                        props: {
                            value: { value: '42' }
                        }
                    }
                },
            });
            const { code } = new GraphCompiler().compileComputeEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, {
                foo: '42',
                bar: 42,
            });
        });

        it('supports array entries', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    res: {
                        ref: 'Array',
                        props: {
                            items: {
                                entries: [
                                    { value: '42' },
                                    { linkId: 'num' },
                                ]
                            },
                        }
                    },
                    num: {
                        ref: 'Number',
                        props: {
                            value: { value: '42' }
                        }
                    }
                },
            });
            const { code } = new GraphCompiler().compileComputeEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, ['42', 42]);
        });

        it('prefers base link over entries if both specified', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    res: {
                        ref: 'Array',
                        props: {
                            items: {
                                linkId: 'p',
                                entries: [
                                    { value: 'one' },
                                    { value: 'two' },
                                ]
                            },
                        }
                    },
                    p: {
                        ref: '@system/Param',
                        props: {
                            key: { value: 'value' }
                        }
                    }
                },
            });
            const { code } = new GraphCompiler().compileComputeEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({
                value: ['foo', 'bar']
            }, ctx);
            assert.deepStrictEqual(res, ['foo', 'bar']);
        });

    });

    describe('array expansion', () => {

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
                { foo: 'one', bar: ['1', '2'], baz: '42' },
                { foo: 'two', bar: ['1', '2'], baz: '42' },
                { foo: 'three', bar: ['1', '2'], baz: '42' },
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
            const results: t.NodeResult[] = [];
            ctx.nodeEvaluated.on(_ => results.push(_));
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, ['1', '2', '42']);
            assert.deepStrictEqual(results, [
                { nodeId: 'res', progress: 0 },
                { nodeId: 'arr', progress: 0 },
                { nodeId: 'arr', result: ['1', '2', '42'] },
                { nodeId: 'res', progress: 0 },
                { nodeId: 'res', progress: 1 / 3 },
                { nodeId: 'res', progress: 2 / 3 },
                { nodeId: 'res', result: ['1', '2', '42'] },
            ]);
        });

    });

    describe('node cache', () => {

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
            const results: t.NodeResult[] = [];
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
            const results: t.NodeResult[] = [];
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

    describe('lambda', () => {

        it('evaluates locals and scoped nodes', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    res: {
                        ref: 'Lambda.Map',
                        props: {
                            array: { linkId: 'arr' },
                            fn: { linkId: 'fn' },
                        }
                    },
                    arr: {
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
                    fn: {
                        ref: 'Array',
                        props: {
                            items: {
                                entries: [
                                    { linkId: 'index' },
                                    { linkId: 'item' },
                                ]
                            }
                        }
                    },
                    index: {
                        ref: '@system/Local',
                        props: {
                            key: { value: 'index' },
                        }
                    },
                    item: {
                        ref: '@system/Local',
                        props: {
                            key: { value: 'item' },
                        }
                    }
                },
            });
            const { code } = new GraphCompiler().compileComputeEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, [
                [0, 'one'],
                [1, 'two'],
                [2, 'three'],
            ]);
        });

    });

    describe('sync/async', () => {

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
            const { code } = new GraphCompiler().compileComputeEsm(graph, { rootNodeId: 'res' });
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
            const { code } = new GraphCompiler().compileComputeEsm(graph, { rootNodeId: 'promise' });
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.strictEqual(res, 43);
            assert.strictEqual(/async\s+/.test(code), true);
            assert.strictEqual(/await\s+/.test(code), true);
        });

    });

    describe('node map', () => {

        it('emits nodeMap', async () => {
            const graph = await runtime.loadGraph({
                nodes: {
                    p1: {
                        ref: '@system/Param',
                        props: {
                            key: { value: 'value' },
                        }
                    },
                    plus1: {
                        ref: 'Math.Add',
                        props: {
                            a: { linkId: 'p1' },
                            b: { value: '1' },
                        }
                    },
                    plus2: {
                        ref: 'Math.Add',
                        props: {
                            a: { linkId: 'p1' },
                            b: { value: '2' },
                        }
                    },
                    mul2: {
                        ref: 'Math.Add',
                        props: {
                            a: { linkId: 'p1' },
                            b: { linkId: 'p1' },
                        }
                    },
                },
            });
            const { code } = new GraphCompiler().compileComputeEsm(graph, {
                rootNodeId: 'plus1',
                emitAll: true,
                emitNodeMap: true,
            });
            const { nodeMap } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const p1 = await nodeMap.get('p1')({ value: 42 }, ctx);
            assert.strictEqual(p1, 42);
            const plus1 = await nodeMap.get('plus1')({ value: 42 }, ctx);
            assert.strictEqual(plus1, 43);
            const plus2 = await nodeMap.get('plus2')({ value: 42 }, ctx);
            assert.strictEqual(plus2, 44);
            const mul2 = await nodeMap.get('mul2')({ value: 80 }, ctx);
            assert.strictEqual(mul2, 160);
        });
    });

});
