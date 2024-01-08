import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/index.js';
import { GraphEvalContext } from '../../main/runtime/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('Compiler: migrations', () => {

    describe('param aliases', () => {

        it('supports param alises', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    res: {
                        ref: 'Migrations.ParamAlias',
                        props: {
                            field: { value: 'foo' },
                        }
                    }
                },
            });
            const { code } = new GraphCompiler().compileEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = compute({}, ctx);
            assert.strictEqual(res, 'foo');
        });

        it('prefers first alias, ignores others', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    res: {
                        ref: 'Migrations.ParamAlias',
                        props: {
                            field: { value: 'foo' },
                            val: { value: 'bar' },
                        }
                    }
                },
            });
            const { code } = new GraphCompiler().compileEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = compute({}, ctx);
            assert.strictEqual(res, 'foo');
        });

        it('ignores alises if prop exists', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    res: {
                        ref: 'Migrations.ParamAlias',
                        props: {
                            value: { value: 'foo' },
                            val: { value: 'bar' },
                            field: { value: 'boo' },
                        }
                    }
                },
            });
            const { code } = new GraphCompiler().compileEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = compute({}, ctx);
            assert.strictEqual(res, 'foo');
        });

    });

});
