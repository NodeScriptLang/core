import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/index.js';
import { GraphEvalContext, GraphView } from '../../main/runtime/index.js';
import { GraphSpecSchema } from '../../main/schema/index.js';
import { codeToUrl, evalEsmModule } from '../../main/util/eval.js';
import { TestModuleLoader } from '../test-loader.js';

describe('Compiler: graphs as modules', () => {

    it('can compile graph and use it as a node', async () => {
        const loader = new TestModuleLoader();
        const graph1 = new GraphView(loader, GraphSpecSchema.create({
            moduleSpec: {
                version: '1.0.0',
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
            nodes: {
                p1: {
                    ref: '@system/Param',
                    props: {
                        key: { value: 'val' },
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
        }));
        await graph1.loadRefs();
        const { code: code1 } = new GraphCompiler().compileEsm(graph1);
        graph1.moduleSpec.attributes = {
            customImportUrl: codeToUrl(code1),
        };
        loader.addModule('graph1', graph1.moduleSpec);
        const graph2 = new GraphView(loader, GraphSpecSchema.create({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'graph1',
                    props: {
                        val: { value: '123' },
                    }
                }
            },
        }));
        await graph2.loadRefs();
        const { code: code2 } = new GraphCompiler().compileEsm(graph2);
        const { compute } = await evalEsmModule(code2);
        const ctx = new GraphEvalContext();
        const res = await compute({}, ctx);
        assert.strictEqual(res, 124);
    });
});
