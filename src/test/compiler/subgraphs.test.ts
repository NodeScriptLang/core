import assert from 'assert';

import { GraphCompiler, GraphEvalContext } from '../../main/runtime/index.js';
import { NodeResult } from '../../main/types/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe.only('Compiler: subgraphs', () => {

    it('compiles and executes a subgraph', async () => {
        const graph = await createGraph();
        const { code } = new GraphCompiler().compileComputeEsm(graph, {
            // introspect: true,
            comments: true,
        });
        console.log(code);
        const ctx = new GraphEvalContext();
        const results: NodeResult[] = [];
        ctx.nodeEvaluated.on(_ => results.push(_));
        const { compute } = await evalEsmModule(code);
        const res = await compute({
            incr: 1
        }, ctx);
        assert.deepStrictEqual(res, [
            [2, 3, 4],
            [42, 43],
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
                    row: {
                        ref: 'Get',
                        props: {
                            object: { linkId: 'args' },
                            key: { value: 'row' },
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
                            a: { linkId: 'row', expand: true },
                            b: { linkId: 'incr' },
                        }
                    }
                }
            }
        }
    });
}
