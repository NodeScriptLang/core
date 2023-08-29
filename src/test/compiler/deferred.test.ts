import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/index.js';
import { GraphEvalContext } from '../../main/runtime/index.js';
import { NodeResult } from '../../main/types/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { omit } from '../helpers.js';
import { runtime } from '../runtime.js';

describe('Compiler: deferred', () => {

    it('does not evaluate branch based on condition', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'if',
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
        const { code } = new GraphCompiler().compileEsm(graph, {
            introspect: true,
        });
        const ctx = new GraphEvalContext();
        const results: NodeResult[] = [];
        ctx.nodeEvaluated.on(_ => results.push(omit(_, 'duration')));
        const { compute } = await evalEsmModule(code);
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, 7);
        assert.deepStrictEqual(results, [
            { nodeUid: 'root:if', progress: 0 },
            { nodeUid: 'root:n2', progress: 0 },
            { nodeUid: 'root:n2', result: 7 },
            { nodeUid: 'root:if', result: 7 },
        ]);
    });

    it('supports array expansion', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'if',
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
        const { code } = new GraphCompiler().compileEsm(graph, {
            introspect: true,
        });
        const ctx = new GraphEvalContext();
        const results: NodeResult[] = [];
        ctx.nodeEvaluated.on(_ => results.push(omit(_, 'duration')));
        const { compute } = await evalEsmModule(code);
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, ['one', 'Hello', 'three']);
        assert.deepStrictEqual(results, [
            { nodeUid: 'root:if', progress: 0 },
            { nodeUid: 'root:conditions', progress: 0 },
            { nodeUid: 'root:conditions', result: [true, false, true] },
            { nodeUid: 'root:arr', progress: 0 },
            { nodeUid: 'root:arr', result: ['one', 'two', 'three'] },
            { nodeUid: 'root:if', progress: 0 },
            { nodeUid: 'root:if', progress: 1 / 3 },
            { nodeUid: 'root:str', progress: 0 },
            { nodeUid: 'root:str', result: 'Hello' },
            { nodeUid: 'root:if', progress: 2 / 3 },
            { nodeUid: 'root:if', result: ['one', 'Hello', 'three'] }
        ]);
    });

    it('does not evaluate branch when expanded', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'if',
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
        const { code } = new GraphCompiler().compileEsm(graph, {
            introspect: true,
        });
        const ctx = new GraphEvalContext();
        const results: NodeResult[] = [];
        ctx.nodeEvaluated.on(_ => results.push(omit(_, 'duration')));
        const { compute } = await evalEsmModule(code);
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, ['one', 'two', 'three']);
        assert.deepStrictEqual(results, [
            { nodeUid: 'root:if', progress: 0 },
            { nodeUid: 'root:conditions', progress: 0 },
            { nodeUid: 'root:conditions', result: [true, true, true] },
            { nodeUid: 'root:arr', progress: 0 },
            { nodeUid: 'root:arr', result: ['one', 'two', 'three'] },
            { nodeUid: 'root:if', progress: 0 },
            { nodeUid: 'root:if', progress: 1 / 3 },
            { nodeUid: 'root:if', progress: 2 / 3 },
            { nodeUid: 'root:if', result: ['one', 'two', 'three'] }
        ]);
    });

    it('works with async nodes', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'if',
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
        const { code } = new GraphCompiler().compileEsm(graph, {
            introspect: true,
        });
        const ctx = new GraphEvalContext();
        const results: NodeResult[] = [];
        ctx.nodeEvaluated.on(_ => results.push(omit(_, 'duration')));
        const { compute } = await evalEsmModule(code);
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, 'World');
        assert.deepStrictEqual(results, [
            { nodeUid: 'root:if', progress: 0 },
            { nodeUid: 'root:n2', progress: 0 },
            { nodeUid: 'root:n2', result: 'World' },
            { nodeUid: 'root:if', result: 'World' },
        ]);
    });

    it('works with async + expand', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'if',
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
        const { code } = new GraphCompiler().compileEsm(graph, {
            introspect: true,
        });
        const ctx = new GraphEvalContext();
        const results: NodeResult[] = [];
        ctx.nodeEvaluated.on(_ => results.push(omit(_, 'duration')));
        const { compute } = await evalEsmModule(code);
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, ['one', 'Hello', 'three']);
        assert.deepStrictEqual(results, [
            { nodeUid: 'root:if', progress: 0 },
            { nodeUid: 'root:conditionsAsync', progress: 0 },
            { nodeUid: 'root:conditions', progress: 0 },
            { nodeUid: 'root:conditions', result: [true, false, true] },
            { nodeUid: 'root:conditionsAsync', result: [true, false, true] },
            { nodeUid: 'root:arrAsync', progress: 0 },
            { nodeUid: 'root:arr', progress: 0 },
            { nodeUid: 'root:arr', result: ['one', 'two', 'three'] },
            { nodeUid: 'root:arrAsync', result: ['one', 'two', 'three'] },
            { nodeUid: 'root:if', progress: 0 },
            { nodeUid: 'root:if', progress: 1 / 3 },
            { nodeUid: 'root:valAsync', progress: 0 },
            { nodeUid: 'root:valAsync', result: 'Hello' },
            { nodeUid: 'root:if', progress: 2 / 3 },
            { nodeUid: 'root:if', result: ['one', 'Hello', 'three'] }
        ]);
    });

    it('supports deferred entries (Fallback)', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'fallback',
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
        const { code } = new GraphCompiler().compileEsm(graph, {
            introspect: true,
        });
        const ctx = new GraphEvalContext();
        const results: NodeResult[] = [];
        ctx.nodeEvaluated.on(_ => results.push(omit(_, 'duration')));
        const { compute } = await evalEsmModule(code);
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, 'Hello');
        assert.deepStrictEqual(results, [
            { nodeUid: 'root:fallback', progress: 0 },
            { nodeUid: 'root:n1', progress: 0 },
            { nodeUid: 'root:n1', result: null },
            { nodeUid: 'root:n2', progress: 0 },
            { nodeUid: 'root:n2', result: 'Hello' },
            { nodeUid: 'root:fallback', result: 'Hello' },
        ]);
    });

});
