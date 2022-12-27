import assert from 'assert';

import { GraphCompiler, GraphEvalContext } from '../../main/runtime/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('Compiler: nodeMap', () => {

    it('emits nodeMap', async () => {
        const graph = await runtime.loadGraph({
            nodes: {
                p1: {
                    ref: '@system/Param',
                    props: {
                        key: { value: 'value' },
                    }
                },
                plus1: {
                    ref: 'Math.Add',
                    props: {
                        a: { linkId: 'p1' },
                        b: { value: '1' },
                    }
                },
                plus2: {
                    ref: 'Math.Add',
                    props: {
                        a: { linkId: 'p1' },
                        b: { value: '2' },
                    }
                },
                mul2: {
                    ref: 'Math.Add',
                    props: {
                        a: { linkId: 'p1' },
                        b: { linkId: 'p1' },
                    }
                },
            },
        });
        const { code } = new GraphCompiler().compileComputeEsm(graph, {
            rootNodeId: 'plus1',
            emitAll: true,
            emitNodeMap: true,
        });
        const { nodeMap } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const p1 = await nodeMap.get('p1')({ value: 42 }, ctx);
        assert.strictEqual(p1, 42);
        const plus1 = await nodeMap.get('plus1')({ value: 42 }, ctx);
        assert.strictEqual(plus1, 43);
        const plus2 = await nodeMap.get('plus2')({ value: 42 }, ctx);
        assert.strictEqual(plus2, 44);
        const mul2 = await nodeMap.get('mul2')({ value: 80 }, ctx);
        assert.strictEqual(mul2, 160);
    });

});
