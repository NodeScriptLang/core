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
            const code = new GraphCompiler().compileEsm(graph);
            const { node } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await node.compute({}, ctx);
            assert.strictEqual(res, 33);
        });

        it('supports introspection', async () => {
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
            const code = new GraphCompiler().compileEsm(graph, {
                introspect: true,
            });
            const { node } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const nodeResults: t.NodeResult[] = [];
            ctx.$nodeEvaluated.on(_ => nodeResults.push(_));
            const res = await node.compute({}, ctx);
            assert.strictEqual(res, 33);
            assert.deepStrictEqual(nodeResults, [
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
            const code = new GraphCompiler().compileEsm(graph);
            const { node } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await node.compute({
                value: 42
            }, ctx);
            assert.strictEqual(res, 43);
        });

    });

    describe('custom graphs', () => {

        it('can compile graph and use it as a node', async () => {
            const loader = await runtime.createLoader();
            const graph1 = await loader.loadGraph({
                rootNodeId: 'res',
                params: {
                    val: {
                        schema: { type: 'number' },
                    }
                },
                result: {
                    type: 'number',
                },
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
            const code1 = new GraphCompiler().compileEsm(graph1);
            const uri1 = codeToUrl(code1);
            await loader.loadNodeDef(uri1);
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
                    'a': uri1,
                }
            });
            const code2 = new GraphCompiler().compileEsm(graph);
            const { node } = await evalEsmModule(code2);
            const ctx = new GraphEvalContext();
            const res = await node.compute({}, ctx);
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
            const code = new GraphCompiler().compileEsm(graph);
            const { node } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await node.compute({}, ctx);
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
            const code = new GraphCompiler().compileEsm(graph);
            const { node } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res1 = await node.compute({ value: true }, ctx);
            assert.strictEqual(res1, true);
            const res2 = await node.compute({ value: 42 }, ctx);
            assert.strictEqual(res2, 42);
            const res3 = await node.compute({ value: { foo: 123 } }, ctx);
            assert.deepStrictEqual(res3, { foo: 123 });
        });

    });

    describe('entries', () => {
        it('supports object entries');
        it('supports array entries');
        it('supports prefer base link over entries');
    });

    describe('array expansion', () => {
        it('expands a single property');
        it('expands a multiple properties');
        it('duplicates non-expanded values');
        it('supports entries');
        it('converts non-arrays to single-element array');
    });

    describe('node cache', () => {
        it('does not evaluate same node twice its result is used more than once');
        it('does not cache node when its result is only used once');
        it('TODO never caches the nodes with cache: never');
        it('TODO always caches the nodes with cache: always');
    });

    describe('lambda', () => {
        it('evaluates locals and scoped nodes');
    });

});
