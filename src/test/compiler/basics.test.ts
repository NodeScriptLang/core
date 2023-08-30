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
        const { code } = new GraphCompiler().compileEsm(graph);
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
        const { code } = new GraphCompiler().compileEsm(graph, {
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
            { nodeUid: 'root:res', progress: 0 },
            { nodeUid: 'root:p1', progress: 0 },
            { nodeUid: 'root:p1', result: 12 },
            { nodeUid: 'root:res', result: 33 },
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
            const { code } = new GraphCompiler().compileEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({
                value: 42
            }, ctx);
            assert.strictEqual(res, 43);
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
                        ref: '@system/Output',
                        props: {
                            value: { linkId: 'p' },
                        }
                    }
                },
            });
            const { code } = new GraphCompiler().compileEsm(graph);
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
            const { code } = new GraphCompiler().compileEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.strictEqual(res, 123);
        });

    });

});
