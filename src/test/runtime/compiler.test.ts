import assert from 'assert';

import { GraphCompiler, GraphEvalContext } from '../../main/runtime/index.js';
import * as t from '../../main/types/index.js';
import { codeToUrl, evalEsmModule } from '../../main/util/index.js';
import { runtime } from '../runtime.js';

describe('GraphCompiler', () => {

    describe('basics', () => {

        it('emits ESM code', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: [
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'a', value: '12' },
                            { key: 'b', value: '21' },
                        ]
                    }
                ],
                refs: {
                    add: runtime.defs['math.add'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = compute({}, ctx);
            assert.strictEqual(res, 33);
        });

        it('supports introspection', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: [
                    {
                        id: 'p1',
                        ref: 'param',
                        props: [
                            { key: 'key', value: 'value' },
                        ]
                    },
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'a', linkId: 'p1' },
                            { key: 'b', value: '21' },
                        ]
                    }
                ],
                refs: {
                    add: runtime.defs['math.add'],
                    param: 'core:Param',
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph, {
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
                nodes: [
                    {
                        id: 'p1',
                        ref: 'param',
                        props: [
                            { key: 'key', value: 'value' },
                        ]
                    },
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'a', linkId: 'p1' },
                            { key: 'b', value: '1' },
                        ]
                    }
                ],
                refs: {
                    param: 'core:Param',
                    add: runtime.defs['math.add'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph);
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
            const loader = await runtime.createLoader();
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
                nodes: [
                    {
                        id: 'p1',
                        ref: 'param',
                        props: [
                            { key: 'key', value: 'val' },
                        ]
                    },
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'a', linkId: 'p1' },
                            { key: 'b', value: '1' },
                        ]
                    }
                ],
                refs: {
                    param: 'core:Param',
                    add: runtime.defs['math.add'],
                }
            });
            const code1 = new GraphCompiler().compileComputeEsm(graph1);
            graph1.moduleSpec.computeUrl = codeToUrl(code1);
            loader.defineModule('graph1', graph1.moduleSpec);
            const graph = await loader.loadGraph({
                rootNodeId: 'res',
                nodes: [
                    {
                        id: 'res',
                        ref: 'a',
                        props: [
                            { key: 'val', value: '123' },
                        ]
                    }
                ],
                refs: {
                    'a': 'graph1',
                }
            });
            const code2 = new GraphCompiler().compileComputeEsm(graph);
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
                nodes: [
                    {
                        id: 'res',
                        ref: 'number',
                        props: [
                            { key: 'value', linkId: 'p' },
                        ]
                    },
                    {
                        id: 'p',
                        ref: 'string',
                        props: [
                            { key: 'value', value: '42' },
                        ]
                    }
                ],
                refs: {
                    string: runtime.defs['string'],
                    number: runtime.defs['number'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.strictEqual(res, 42);
        });

        it('does not convert types when schemas match', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: [
                    {
                        id: 'res',
                        ref: 'any',
                        props: [
                            { key: 'value', linkId: 'p' },
                        ]
                    },
                    {
                        id: 'p',
                        ref: 'param',
                        props: [
                            { key: 'key', value: 'value' },
                        ]
                    }
                ],
                refs: {
                    param: 'core:Param',
                    any: runtime.defs['any'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph);
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
                nodes: [
                    {
                        id: 'res',
                        ref: 'object',
                        props: [
                            {
                                key: 'properties',
                                entries: [
                                    { key: 'foo', value: '42' },
                                    { key: 'bar', linkId: 'num' },
                                ]
                            },
                        ]
                    },
                    {
                        id: 'num',
                        ref: 'number',
                        props: [
                            { key: 'value', value: '42' }
                        ]
                    }
                ],
                refs: {
                    number: runtime.defs['number'],
                    object: runtime.defs['object'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph);
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
                nodes: [
                    {
                        id: 'res',
                        ref: 'array',
                        props: [
                            {
                                key: 'items',
                                entries: [
                                    { value: '42' },
                                    { linkId: 'num' },
                                ]
                            },
                        ]
                    },
                    {
                        id: 'num',
                        ref: 'number',
                        props: [
                            { key: 'value', value: '42' }
                        ]
                    }
                ],
                refs: {
                    number: runtime.defs['number'],
                    array: runtime.defs['array'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, ['42', 42]);
        });

        it('prefers base link over entries if both specified', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: [
                    {
                        id: 'res',
                        ref: 'array',
                        props: [
                            {
                                key: 'items',
                                linkId: 'p',
                                entries: [
                                    { value: 'one' },
                                    { value: 'two' },
                                ]
                            },
                        ]
                    },
                    {
                        id: 'p',
                        ref: 'param',
                        props: [
                            { key: 'key', value: 'value' }
                        ]
                    }
                ],
                refs: {
                    param: 'core:Param',
                    array: runtime.defs['array'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph);
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
                nodes: [
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'a', linkId: 'arr', expand: true },
                            { key: 'b', value: '1' },
                        ]
                    },
                    {
                        id: 'arr',
                        ref: 'array',
                        props: [
                            {
                                key: 'items',
                                entries: [
                                    { key: 'value', value: '1' },
                                    { key: 'value', value: '2' },
                                    { key: 'value', value: '42' },
                                ]
                            }
                        ]
                    }
                ],
                refs: {
                    array: runtime.defs['array'],
                    add: runtime.defs['math.add'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, [2, 3, 43]);
        });

        it('expands multiple properties, same array length', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: [
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'a', linkId: 'arr', expand: true },
                            { key: 'b', linkId: 'arr', expand: true },
                        ]
                    },
                    {
                        id: 'arr',
                        ref: 'array',
                        props: [
                            {
                                key: 'items',
                                entries: [
                                    { key: 'value', value: '1' },
                                    { key: 'value', value: '2' },
                                    { key: 'value', value: '42' },
                                ]
                            }
                        ]
                    }
                ],
                refs: {
                    array: runtime.defs['array'],
                    add: runtime.defs['math.add'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, [2, 4, 84]);
        });

        it('expands multiple properties, different array lengths', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: [
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'a', linkId: 'arr1', expand: true },
                            { key: 'b', linkId: 'arr2', expand: true },
                        ]
                    },
                    {
                        id: 'arr1',
                        ref: 'array',
                        props: [
                            {
                                key: 'items',
                                entries: [
                                    { key: 'value', value: '1' },
                                    { key: 'value', value: '2' },
                                    { key: 'value', value: '42' },
                                ]
                            }
                        ]
                    },
                    {
                        id: 'arr2',
                        ref: 'array',
                        props: [
                            {
                                key: 'items',
                                entries: [
                                    { key: 'value', value: '2' },
                                    { key: 'value', value: '3' },
                                ]
                            }
                        ]
                    }
                ],
                refs: {
                    array: runtime.defs['array'],
                    add: runtime.defs['math.add'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, [3, 5]);
        });

        it('supports entries', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: [
                    {
                        id: 'res',
                        ref: 'object',
                        props: [
                            {
                                key: 'properties',
                                entries: [
                                    { key: 'foo', linkId: 'arr1', expand: true },
                                    { key: 'bar', linkId: 'arr2' },
                                    { key: 'baz', value: '42' },
                                ]
                            }
                        ]
                    },
                    {
                        id: 'arr1',
                        ref: 'array',
                        props: [
                            {
                                key: 'items',
                                entries: [
                                    { key: 'value', value: 'one' },
                                    { key: 'value', value: 'two' },
                                    { key: 'value', value: 'three' },
                                ]
                            }
                        ]
                    },
                    {
                        id: 'arr2',
                        ref: 'array',
                        props: [
                            {
                                key: 'items',
                                entries: [
                                    { key: 'value', value: '1' },
                                    { key: 'value', value: '2' },
                                ]
                            }
                        ]
                    }
                ],
                refs: {
                    object: runtime.defs['object'],
                    array: runtime.defs['array'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph);
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
                nodes: [
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'a', value: '2', expand: true },
                            { key: 'b', linkId: 'p', expand: true },
                        ]
                    },
                    {
                        id: 'p',
                        ref: 'string',
                        props: [
                            { key: 'value', value: '42' },
                        ]
                    }
                ],
                refs: {
                    add: runtime.defs['math.add'],
                    string: runtime.defs['string'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, [44]);
        });

        it('emits progress', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: [
                    {
                        id: 'res',
                        ref: 'any',
                        props: [
                            { key: 'value', linkId: 'arr', expand: true },
                        ]
                    },
                    {
                        id: 'arr',
                        ref: 'array',
                        props: [
                            {
                                key: 'items',
                                entries: [
                                    { key: 'value', value: '1' },
                                    { key: 'value', value: '2' },
                                    { key: 'value', value: '42' },
                                ]
                            }
                        ]
                    }
                ],
                refs: {
                    array: runtime.defs['array'],
                    any: runtime.defs['any'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph, { introspect: true });
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
                nodes: [
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'a', linkId: 'p' },
                            { key: 'b', linkId: 'p' },
                        ]
                    },
                    {
                        id: 'p',
                        ref: 'string',
                        props: [
                            { key: 'value', value: '42' },
                        ]
                    }
                ],
                refs: {
                    add: runtime.defs['math.add'],
                    string: runtime.defs['string'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph, { introspect: true });
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
                nodes: [
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'a', linkId: 'p' },
                            { key: 'b', value: '12' },
                        ]
                    },
                    {
                        id: 'p',
                        ref: 'string',
                        props: [
                            { key: 'value', value: '42' },
                        ]
                    }
                ],
                refs: {
                    add: runtime.defs['math.add'],
                    string: runtime.defs['string'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph, { introspect: true });
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
                nodes: [
                    {
                        id: 'res',
                        ref: 'map',
                        props: [
                            { key: 'array', linkId: 'arr' },
                            { key: 'fn', linkId: 'fn' },
                        ]
                    },
                    {
                        id: 'arr',
                        ref: 'array',
                        props: [
                            {
                                key: 'items',
                                entries: [
                                    { value: 'one' },
                                    { value: 'two' },
                                    { value: 'three' },
                                ]
                            },
                        ]
                    },
                    {
                        id: 'fn',
                        ref: 'array',
                        props: [
                            {
                                key: 'items',
                                entries: [
                                    { linkId: 'index' },
                                    { linkId: 'item' },
                                ]
                            }
                        ]
                    },
                    {
                        id: 'index',
                        ref: 'local',
                        props: [
                            { key: 'key', value: 'index' },
                        ]
                    },
                    {
                        id: 'item',
                        ref: 'local',
                        props: [
                            { key: 'key', value: 'item' },
                        ]
                    }
                ],
                refs: {
                    map: runtime.defs['lambda.map'],
                    array: runtime.defs['array'],
                    local: 'core:Local',
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph);
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
                nodes: [
                    {
                        id: 'p1',
                        ref: 'number',
                        props: [
                            { key: 'value', value: '42' },
                        ]
                    },
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'a', linkId: 'p1' },
                            { key: 'b', value: '1' },
                        ]
                    },
                    {
                        id: 'promise',
                        ref: 'promise',
                        props: [
                            { key: 'value', linkId: 'res' },
                        ]
                    }
                ],
                refs: {
                    number: runtime.defs['number'],
                    add: runtime.defs['math.add'],
                    promise: runtime.defs['promise'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph, { rootNodeId: 'res' });
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
                nodes: [
                    {
                        id: 'p1',
                        ref: 'number',
                        props: [
                            { key: 'value', value: '42' },
                        ]
                    },
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'a', linkId: 'p1' },
                            { key: 'b', value: '1' },
                        ]
                    },
                    {
                        id: 'promise',
                        ref: 'promise',
                        props: [
                            { key: 'value', linkId: 'res' },
                        ]
                    }
                ],
                refs: {
                    number: runtime.defs['number'],
                    add: runtime.defs['math.add'],
                    promise: runtime.defs['promise'],
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph, { rootNodeId: 'promise' });
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
                nodes: [
                    {
                        id: 'p1',
                        ref: 'param',
                        props: [
                            { key: 'key', value: 'value' },
                        ]
                    },
                    {
                        id: 'plus1',
                        ref: 'add',
                        props: [
                            { key: 'a', linkId: 'p1' },
                            { key: 'b', value: '1' },
                        ]
                    },
                    {
                        id: 'plus2',
                        ref: 'add',
                        props: [
                            { key: 'a', linkId: 'p1' },
                            { key: 'b', value: '2' },
                        ]
                    },
                    {
                        id: 'mul2',
                        ref: 'add',
                        props: [
                            { key: 'a', linkId: 'p1' },
                            { key: 'b', linkId: 'p1' },
                        ]
                    },
                ],
                refs: {
                    add: runtime.defs['math.add'],
                    param: 'core:Param',
                }
            });
            const code = new GraphCompiler().compileComputeEsm(graph, {
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
