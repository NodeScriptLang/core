import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/index.js';
import { GraphEvalContext } from '../../main/runtime/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('Compiler: subgraphs', () => {

    it('compiles and executes a subgraph', async () => {
        const graph = await createGraph();
        const { code } = new GraphCompiler().compileEsm(graph, {
            comments: true,
        });
        const ctx = new GraphEvalContext();
        const { compute } = await evalEsmModule(code);
        const res1 = compute({ incr: 1 }, ctx);
        assert.deepStrictEqual(res1, [
            [2, 3, 4],
            [42, 43],
        ]);
        const res2 = compute({ incr: 2 }, ctx);
        assert.deepStrictEqual(res2, [
            [3, 4, 5],
            [43, 44],
        ]);
    });

});

async function createGraph() {
    return await runtime.loadGraph({
        rootNodeId: 'res',
        nodes: {
            data: {
                ref: '@system/EvalJson',
                props: {
                    code: {
                        value: JSON.stringify([
                            [1, 2, 3],
                            [41, 42],
                        ])
                    },
                }
            },
            p: {
                ref: '@system/Param',
                props: {
                    key: { value: 'incr' },
                }
            },
            res: {
                ref: '@system/Subgraph',
                metadata: {
                    subgraphId: 'op',
                },
                props: {
                    args: {
                        entries: [
                            {
                                key: 'record',
                                linkId: 'data',
                                expand: true,
                            },
                            {
                                key: 'incr',
                                linkId: 'p',
                            }
                        ]
                    },
                }
            },
        },
        subgraphs: {
            op: {
                rootNodeId: 'res',
                nodes: {
                    args: {
                        ref: '@system/Param',
                        props: {
                            key: { value: 'args' },
                        }
                    },
                    record: {
                        ref: 'Get',
                        props: {
                            object: { linkId: 'args' },
                            key: { value: 'record' },
                        }
                    },
                    incr: {
                        ref: 'Get',
                        props: {
                            object: { linkId: 'args' },
                            key: { value: 'incr' },
                        }
                    },
                    res: {
                        ref: 'Math.Add',
                        props: {
                            a: { linkId: 'record', expand: true },
                            b: { linkId: 'incr' },
                        }
                    }
                }
            }
        }
    });
}
