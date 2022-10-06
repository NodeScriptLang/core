import assert from 'assert';

import { TestGraphLoader } from '../test-loader.js';

describe('Node', () => {

    describe('canLinkTo', () => {

        it('specifies whether a property is linkable or not', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'res',
                        ref: 'String',
                        props: [
                            { key: 'value', value: '42' },
                        ]
                    },
                    {
                        id: 'p',
                        ref: 'String',
                        props: [
                            { key: 'value', value: '42', linkId: 'res' },
                        ]
                    }
                ],
            });
            const node1 = graph.getNodeById('res')!;
            const node2 = graph.getNodeById('p')!;
            assert.strictEqual(node1?.canLinkTo(node2), true);
            assert.strictEqual(node2?.canLinkTo(node1), false);
        });
    });

});
