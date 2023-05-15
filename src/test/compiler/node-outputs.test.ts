import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/index.js';
import { GraphEvalContext } from '../../main/runtime/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('Compiler: node outputs', () => {

    it('supports custom node outputs', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                data: {
                    ref: '@system/EvalJson',
                    props: {
                        code: {
                            value: JSON.stringify({
                                foo: {
                                    bar: 123,
                                    baz: 234,
                                },
                                qux: 345,
                            }),
                        },
                    }
                },
                res: {
                    ref: 'Object',
                    props: {
                        properties: {
                            entries: [
                                { key: 'a', linkId: 'data', linkKey: 'foo.bar' },
                                { key: 'b', linkId: 'data', linkKey: 'qux' },
                            ]
                        },
                    }
                }
            }
        });
        const { code } = new GraphCompiler().compileEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, {
            a: 123,
            b: 345,
        });
    });

    it('destructures arrays', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                data: {
                    ref: '@system/EvalJson',
                    props: {
                        code: {
                            value: JSON.stringify({
                                items: [
                                    { name: 'banana', price: 100 },
                                    { name: 'orange', price: 200 },
                                    { name: 'apple', price: 300 },
                                ]
                            }),
                        },
                    }
                },
                res: {
                    ref: 'Math.Add',
                    props: {
                        a: {
                            linkId: 'data',
                            linkKey: 'items.*.price',
                            expand: true,
                        },
                        b: {
                            value: '1',
                        }
                    }
                }
            }
        });
        const { code } = new GraphCompiler().compileEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, [101, 201, 301]);
    });

});
