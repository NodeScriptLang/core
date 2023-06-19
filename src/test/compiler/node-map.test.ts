import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/index.js';
import { GraphEvalContext } from '../../main/runtime/index.js';
import { evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('Compiler: nodeMap', () => {

    it('emits nodeMap', async () => {
        const graph = await runtime.loadGraph({
            rootNodeId: 'plus1',
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
        const { code } = new GraphCompiler().compileEsm(graph, {
            emitAll: true,
            emitNodeMap: true,
        });
        const { nodeMap } = await evalEsmModule(code);
        const ctx = new GraphEvalContext();
        const p1 = await nodeMap.get('root:p1')({ value: 42 }, ctx);
        assert.strictEqual(p1, 42);
        const plus1 = await nodeMap.get('root:plus1')({ value: 42 }, ctx);
        assert.strictEqual(plus1, 43);
        const plus2 = await nodeMap.get('root:plus2')({ value: 42 }, ctx);
        assert.strictEqual(plus2, 44);
        const mul2 = await nodeMap.get('root:mul2')({ value: 80 }, ctx);
        assert.strictEqual(mul2, 160);
    });

});
