import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/index.js';
import { GraphEvalContext } from '../../main/runtime/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('Compiler: subgraphs', () => {

    describe('Flow / Step', () => {

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

        it('accepts scope data');

    });

});
