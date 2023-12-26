import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/GraphCompiler.js';
import { GraphEvalContext } from '../../main/runtime/GraphEvalContext.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('EvalTemplate', () => {

    it('evaluates template string', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: '@system/EvalTemplate',
                    props: {
                        template: {
                            value: 'Hello World!'
                        }
                    }
                },
            },
        });
        const { code } = new GraphCompiler().compileEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = compute({}, ctx);
        assert.strictEqual(res, 'Hello World!');
    });

    it('supports arguments', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: '@system/EvalTemplate',
                    props: {
                        args: {
                            entries: [
                                { key: 'a', value: '1' },
                                { key: 'b', value: '2' },
                            ],
                        },
                        template: {
                            value: '${a} + ${b} = ${a + b}'
                        }
                    }
                },
            },
        });
        const { code } = new GraphCompiler().compileEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = compute({}, ctx);
        assert.strictEqual(res, '1 + 2 = 3');
    });

    it('escapes backticks', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: '@system/EvalTemplate',
                    props: {
                        template: {
                            value: 'Some `code` here. Escaped \\` too.'
                        }
                    }
                },
            },
        });
        const { code } = new GraphCompiler().compileEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = compute({}, ctx);
        assert.strictEqual(res, 'Some `code` here. Escaped \\` too.');
    });

});
