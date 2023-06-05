import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/index.js';
import { GraphEvalContext } from '../../main/runtime/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('Compiler: subgraphs', () => {

    describe('Flow / Subgraph', () => {

        it('returns the value from subgraph', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    res: {
                        ref: 'Flow.Subgraph',
                        subgraph: {
                            rootNodeId: 'out',
                            nodes: {
                                out: {
                                    ref: 'String',
                                    props: {
                                        value: {
                                            value: 'Hello World!',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            const { code } = new GraphCompiler().compileEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.strictEqual(res, 'Hello World!');
        });

        it('accepts scope data', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    res: {
                        ref: 'Flow.Subgraph',
                        props: {
                            scope: {
                                entries: [
                                    {
                                        key: 'a',
                                        value: '1',
                                    },
                                    {
                                        key: 'b',
                                        value: '2',
                                    },
                                ]
                            }
                        },
                        subgraph: {
                            rootNodeId: 'out',
                            nodes: {
                                input: {
                                    ref: '@system/Input',
                                },
                                out: {
                                    ref: 'Math.Add',
                                    props: {
                                        a: {
                                            linkId: 'input',
                                            linkKey: 'a',
                                        },
                                        b: {
                                            linkId: 'input',
                                            linkKey: 'b',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            const { code } = new GraphCompiler().compileEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.strictEqual(res, 3);
        });

        it('supports expansion', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    arr: {
                        ref: 'Array',
                        props: {
                            items: {
                                entries: [
                                    { value: '1' },
                                    { value: '2' },
                                    { value: '3' },
                                ]
                            }
                        }
                    },
                    res: {
                        ref: 'Flow.Subgraph',
                        props: {
                            scope: {
                                entries: [
                                    {
                                        key: 'a',
                                        value: '1',
                                    },
                                    {
                                        key: 'b',
                                        linkId: 'arr',
                                        expand: true,
                                    },
                                ]
                            }
                        },
                        subgraph: {
                            rootNodeId: 'out',
                            nodes: {
                                input: {
                                    ref: '@system/Input',
                                },
                                out: {
                                    ref: 'Math.Add',
                                    props: {
                                        a: {
                                            linkId: 'input',
                                            linkKey: 'a',
                                        },
                                        b: {
                                            linkId: 'input',
                                            linkKey: 'b',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            const { code } = new GraphCompiler().compileEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.deepStrictEqual(res, [2, 3, 4]);
        });

    });

    describe('Flow / Scan', () => {

        it('scans an array, returning when done is true', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    arr: {
                        ref: '@system/EvalJson',
                        props: {
                            code: {
                                value: JSON.stringify([
                                    { id: 1, value: 'one' },
                                    { id: 2, value: 'two' },
                                    { id: 3, value: 'three' },
                                ]),
                            }
                        }
                    },
                    res: {
                        ref: 'Flow.Scan',
                        props: {
                            array: {
                                linkId: 'arr',
                            },
                            scope: {
                                entries: [
                                    { key: 'search', value: '2' },
                                ]
                            },
                        },
                        subgraph: {
                            rootNodeId: 'out',
                            nodes: {
                                input: {
                                    ref: '@system/Input',
                                },
                                if: {
                                    ref: '@system/EvalSync',
                                    props: {
                                        code: {
                                            value: 'return a == b',
                                        },
                                        args: {
                                            entries: [
                                                {
                                                    key: 'a',
                                                    linkId: 'input',
                                                    linkKey: 'item.id',
                                                },
                                                {
                                                    key: 'b',
                                                    linkId: 'input',
                                                    linkKey: 'search',
                                                },
                                            ]
                                        }
                                    },
                                },
                                out: {
                                    ref: '@system/Output',
                                    props: {
                                        done: {
                                            linkId: 'if'
                                        },
                                        result: {
                                            linkId: 'input',
                                            linkKey: 'item.value'
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            const { code } = new GraphCompiler().compileEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.strictEqual(res, 'two');
        });

    });

});
