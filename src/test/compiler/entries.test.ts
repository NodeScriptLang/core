import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/index.js';
import { GraphEvalContext } from '../../main/runtime/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('Compiler: entries', () => {

    it('supports object entries', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Object',
                    props: {
                        properties: {
                            entries: [
                                { key: 'foo', value: '42' },
                                { key: 'bar', linkId: 'num' },
                            ]
                        },
                    }
                },
                num: {
                    ref: 'Number',
                    props: {
                        value: { value: '42' }
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, {
            foo: 42,
            bar: 42,
        });
    });

    it('supports array entries', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Array',
                    props: {
                        items: {
                            entries: [
                                { value: '42' },
                                { linkId: 'num' },
                            ]
                        },
                    }
                },
                num: {
                    ref: 'Number',
                    props: {
                        value: { value: '42' }
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await compute({}, ctx);
        assert.deepStrictEqual(res, [42, 42]);
    });

    it('prefers base link over entries if both specified', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'res',
            nodes: {
                res: {
                    ref: 'Array',
                    props: {
                        items: {
                            linkId: 'p',
                            entries: [
                                { value: 'one' },
                                { value: 'two' },
                            ]
                        },
                    }
                },
                p: {
                    ref: '@system/Param',
                    props: {
                        key: { value: 'value' }
                    }
                }
            },
        });
        const { code } = new GraphCompiler().compileEsm(graph);
        const { compute } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const res = await compute({
            value: ['foo', 'bar']
        }, ctx);
        assert.deepStrictEqual(res, ['foo', 'bar']);
    });

});
