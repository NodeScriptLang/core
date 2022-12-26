import assert from 'assert';

import { GraphCompiler, GraphEvalContext, GraphView } from '../../main/runtime/index.js';
import { GraphSpecSchema } from '../../main/schema/GraphSpec.js';
import { NodeResult } from '../../main/types/index.js';
import { codeToUrl, evalEsmModule } from '../../main/util/index.js';
import { runtime } from '../runtime.js';
import { TestModuleLoader } from '../test-loader.js';

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

    describe('graphs as modules', () => {

        it('can compile graph and use it as a node', async () => {
            const loader = new TestModuleLoader();
            const graph1 = new GraphView(loader, GraphSpecSchema.create({
                moduleSpec: {
                    moduleId: 'graph1',
                    version: '1.0.0',
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
            }));
            await graph1.loadRefs();
            const { code: code1 } = new GraphCompiler().compileComputeEsm(graph1);
            graph1.moduleSpec.attributes = {
                customImportUrl: codeToUrl(code1),
            };
            loader.addModule(graph1.moduleSpec);
            const graph2 = new GraphView(loader, GraphSpecSchema.create({
                rootNodeId: 'res',
                nodes: {
                    res: {
                        ref: 'graph1',
                        props: {
                            val: { value: '123' },
                        }
                    }
                },
            }));
            await graph2.loadRefs();
            const { code: code2 } = new GraphCompiler().compileComputeEsm(graph2);
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
                foo: 42,
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
            assert.deepStrictEqual(res, [42, 42]);
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

    describe('deferred', () => {

        it('does not evaluate branch based on condition', async () => {
            const graph = await runtime.loadGraph({
                nodes: {
                    n1: {
                        ref: 'Math.Add',
                        props: {
                            a: { value: '1' },
                            b: { value: '2' },
                        }
                    },
                    n2: {
                        ref: 'Math.Add',
                        props: {
                            a: { value: '3' },
                            b: { value: '4' },
                        }
                    },
                    if: {
                        ref: 'If',
                        props: {
                            condition: { value: 'false' },
                            positive: { linkId: 'n1' },
                            negative: { linkId: 'n2' },
                        }
                    },
                },
            });
            const { code } = new GraphCompiler().compileComputeEsm(graph, {
                rootNodeId: 'if',
                introspect: true,
            });
            const ctx = new GraphEvalContext();
            const results: NodeResult[] = [];
            ctx.nodeEvaluated.on(_ => results.push(_));
            const { compute } = await evalEsmModule(code);
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, 7);
            assert.deepStrictEqual(results, [
                { nodeId: 'if', progress: 0 },
                { nodeId: 'n2', progress: 0 },
                { nodeId: 'n2', result: 7 },
                { nodeId: 'if', result: 7 },
            ]);
        });

        it('supports array expansion', async () => {
            const graph = await runtime.loadGraph({
                nodes: {
                    conditions: {
                        ref: 'Array',
                        props: {
                            items: {
                                entries: [
                                    { value: 'true' },
                                    { value: 'false' },
                                    { value: 'true' },
                                ]
                            },
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
                    str: {
                        ref: 'String',
                        props: {
                            value: { value: 'Hello' },
                        }
                    },
                    if: {
                        ref: 'If',
                        props: {
                            condition: { linkId: 'conditions', expand: true },
                            positive: { linkId: 'arr', expand: true },
                            negative: { linkId: 'str' },
                        }
                    },
                },
            });
            const { code } = new GraphCompiler().compileComputeEsm(graph, {
                rootNodeId: 'if',
                introspect: true,
            });
            const ctx = new GraphEvalContext();
            const results: NodeResult[] = [];
            ctx.nodeEvaluated.on(_ => results.push(_));
            const { compute } = await evalEsmModule(code);
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, ['one', 'Hello', 'three']);
            assert.deepStrictEqual(results, [
                { nodeId: 'if', progress: 0 },
                { nodeId: 'conditions', progress: 0 },
                { nodeId: 'conditions', result: [true, false, true] },
                { nodeId: 'arr', progress: 0 },
                { nodeId: 'arr', result: ['one', 'two', 'three'] },
                { nodeId: 'if', progress: 0 },
                { nodeId: 'if', progress: 1 / 3 },
                { nodeId: 'str', progress: 0 },
                { nodeId: 'str', result: 'Hello' },
                { nodeId: 'if', progress: 2 / 3 },
                { nodeId: 'if', result: ['one', 'Hello', 'three'] }
            ]);
        });

        it('does not evaluate branch when expanded', async () => {
            const graph = await runtime.loadGraph({
                nodes: {
                    conditions: {
                        ref: 'Array',
                        props: {
                            items: {
                                entries: [
                                    { value: 'true' },
                                    { value: 'true' },
                                    { value: 'true' },
                                ]
                            },
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
                    str: {
                        ref: 'String',
                        props: {
                            value: { value: 'Hello' },
                        }
                    },
                    if: {
                        ref: 'If',
                        props: {
                            condition: { linkId: 'conditions', expand: true },
                            positive: { linkId: 'arr', expand: true },
                            negative: { linkId: 'str' },
                        }
                    },
                },
            });
            const { code } = new GraphCompiler().compileComputeEsm(graph, {
                rootNodeId: 'if',
                introspect: true,
            });
            const ctx = new GraphEvalContext();
            const results: NodeResult[] = [];
            ctx.nodeEvaluated.on(_ => results.push(_));
            const { compute } = await evalEsmModule(code);
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, ['one', 'two', 'three']);
            assert.deepStrictEqual(results, [
                { nodeId: 'if', progress: 0 },
                { nodeId: 'conditions', progress: 0 },
                { nodeId: 'conditions', result: [true, true, true] },
                { nodeId: 'arr', progress: 0 },
                { nodeId: 'arr', result: ['one', 'two', 'three'] },
                { nodeId: 'if', progress: 0 },
                { nodeId: 'if', progress: 1 / 3 },
                { nodeId: 'if', progress: 2 / 3 },
                { nodeId: 'if', result: ['one', 'two', 'three'] }
            ]);
        });

        it('works with async nodes', async () => {
            const graph = await runtime.loadGraph({
                nodes: {
                    n1: {
                        ref: 'Promise',
                        props: {
                            value: { value: 'Hello' },
                        }
                    },
                    n2: {
                        ref: 'Promise',
                        props: {
                            value: { value: 'World' },
                        }
                    },
                    if: {
                        ref: 'If',
                        props: {
                            condition: { value: 'false' },
                            positive: { linkId: 'n1' },
                            negative: { linkId: 'n2' },
                        }
                    },
                },
            });
            const { code } = new GraphCompiler().compileComputeEsm(graph, {
                rootNodeId: 'if',
                introspect: true,
            });
            const ctx = new GraphEvalContext();
            const results: NodeResult[] = [];
            ctx.nodeEvaluated.on(_ => results.push(_));
            const { compute } = await evalEsmModule(code);
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, 'World');
            assert.deepStrictEqual(results, [
                { nodeId: 'if', progress: 0 },
                { nodeId: 'n2', progress: 0 },
                { nodeId: 'n2', result: 'World' },
                { nodeId: 'if', result: 'World' },
            ]);
        });

        it('works with async + expand', async () => {
            const graph = await runtime.loadGraph({
                nodes: {
                    conditions: {
                        ref: 'Array',
                        props: {
                            items: {
                                entries: [
                                    { value: 'true' },
                                    { value: 'false' },
                                    { value: 'true' },
                                ]
                            },
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
                    conditionsAsync: {
                        ref: 'Promise',
                        props: {
                            value: { linkId: 'conditions' },
                        }
                    },
                    arrAsync: {
                        ref: 'Promise',
                        props: {
                            value: { linkId: 'arr' },
                        }
                    },
                    valAsync: {
                        ref: 'Promise',
                        props: {
                            value: { value: 'Hello' },
                        }
                    },
                    if: {
                        ref: 'If',
                        props: {
                            condition: { linkId: 'conditionsAsync', expand: true },
                            positive: { linkId: 'arrAsync', expand: true },
                            negative: { linkId: 'valAsync' },
                        }
                    },
                },
            });
            const { code } = new GraphCompiler().compileComputeEsm(graph, {
                rootNodeId: 'if',
                introspect: true,
            });
            const ctx = new GraphEvalContext();
            const results: NodeResult[] = [];
            ctx.nodeEvaluated.on(_ => results.push(_));
            const { compute } = await evalEsmModule(code);
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, ['one', 'Hello', 'three']);
            assert.deepStrictEqual(results, [
                { nodeId: 'if', progress: 0 },
                { nodeId: 'conditionsAsync', progress: 0 },
                { nodeId: 'conditions', progress: 0 },
                { nodeId: 'conditions', result: [true, false, true] },
                { nodeId: 'conditionsAsync', result: [true, false, true] },
                { nodeId: 'arrAsync', progress: 0 },
                { nodeId: 'arr', progress: 0 },
                { nodeId: 'arr', result: ['one', 'two', 'three'] },
                { nodeId: 'arrAsync', result: ['one', 'two', 'three'] },
                { nodeId: 'if', progress: 0 },
                { nodeId: 'if', progress: 1 / 3 },
                { nodeId: 'valAsync', progress: 0 },
                { nodeId: 'valAsync', result: 'Hello' },
                { nodeId: 'if', progress: 2 / 3 },
                { nodeId: 'if', result: ['one', 'Hello', 'three'] }
            ]);
        });

        it('supports deferred entries (Fallback)', async () => {
            const graph = await runtime.loadGraph({
                nodes: {
                    n1: {
                        ref: '@system/EvalSync',
                        props: {
                            code: { value: 'return null' },
                        }
                    },
                    n2: {
                        ref: 'Promise',
                        props: {
                            value: { value: 'Hello' },
                        }
                    },
                    n3: {
                        ref: 'Promise',
                        props: {
                            value: { value: 'Bye' },
                        }
                    },
                    fallback: {
                        ref: 'Fallback',
                        props: {
                            steps: {
                                entries: [
                                    { linkId: 'n1' },
                                    { linkId: 'n2' },
                                    { linkId: 'n3' },
                                ]
                            },
                        }
                    },
                },
            });
            const { code } = new GraphCompiler().compileComputeEsm(graph, {
                rootNodeId: 'fallback',
                introspect: true,
            });
            const ctx = new GraphEvalContext();
            const results: NodeResult[] = [];
            ctx.nodeEvaluated.on(_ => results.push(_));
            const { compute } = await evalEsmModule(code);
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, 'Hello');
            assert.deepStrictEqual(results, [
                { nodeId: 'fallback', progress: 0 },
                { nodeId: 'n1', progress: 0 },
                { nodeId: 'n1', result: null },
                { nodeId: 'n2', progress: 0 },
                { nodeId: 'n2', result: 'Hello' },
                { nodeId: 'fallback', result: 'Hello' },
            ]);
        });

    });

});
