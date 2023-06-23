import assert from 'assert';

import { NodeView } from '../main/runtime/NodeView.js';
import { runtime } from './runtime.js';

describe('NodeView', () => {

    describe('orderNodes', () => {

        it('orders nodes by topology', async () => {
            // A - B     F
            //       \  /
            //        C
            //       /  \
            // E - D     G
            const graph = await runtime.loadGraph({
                nodes: {
                    a: { ref: 'Any' },
                    e: { ref: 'Any' },
                    b: {
                        ref: 'Any',
                        props: {
                            value: { linkId: 'a' },
                        }
                    },
                    d: {
                        ref: 'Any',
                        props: {
                            value: { linkId: 'e' },
                        }
                    },
                    c: {
                        ref: 'Array',
                        props: {
                            items: {
                                entries: [
                                    { linkId: 'b' },
                                    { linkId: 'd' },
                                ]
                            }
                        }
                    },
                    f: {
                        ref: 'Any',
                        props: {
                            value: { linkId: 'c' },
                        }
                    },
                    g: {
                        ref: 'Any',
                        props: {
                            value: { linkId: 'c' },
                        }
                    },
                },
            });
            const cases = [
                ['cfdgbae', 'fgcdbae'],
                ['abfedcg', 'fgcbade'],
                ['cab', 'cba'],
                ['bdc', 'cbd'],
                ['abcf', 'fcba'],
                ['fcba', 'fcba'],
            ];
            for (const [initial, expected] of cases) {
                const nodes = initial.split('').map(_ => graph.getNodeById(_)!);
                const ordered = NodeView.orderNodes(nodes);
                const ids = ordered.map(_ => _.localId).join('');
                assert.strictEqual(ids, expected);
            }
        });
    });

});
