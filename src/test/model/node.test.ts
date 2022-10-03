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

    describe('addPropEntry', () => {

        it('adds an entry to supported properties', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'obj',
                        ref: 'Object',
                        props: [
                            { key: 'properties' },
                        ]
                    },
                    {
                        id: 'arr',
                        ref: 'Array',
                        props: [
                            { key: 'items' },
                        ]
                    },
                    {
                        id: 'str',
                        ref: 'String',
                        props: [
                            { key: 'value' },
                        ]
                    }
                ],
            });
            const node1 = graph.getNodeById('obj');
            const node2 = graph.getNodeById('arr');
            const node3 = graph.getNodeById('str');
            node1?.addPropEntry('properties');
            node2?.addPropEntry('items');
            node3?.addPropEntry('value');
            assert.strictEqual(node1?.props[0].entries.length, 1);
            assert.strictEqual(node2?.props[0].entries.length, 1);
            assert.strictEqual(node3?.props[0].entries.length, 0);
        });

    });

    describe('removePropEntry', () => {

        it('removes a property entry', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'obj',
                        ref: 'Object',
                        props: [
                            {
                                key: 'properties',
                                entries: [
                                    { id: 'test', key: 'foo', expand: true },
                                ]
                            }
                        ]
                    },
                ]
            });
            const node = graph.getNodeById('obj');
            assert.strictEqual(node?.props[0].entries.length, 1);
            node?.removePropEntry('properties', 'test');
            assert.strictEqual(node?.props[0].entries.length, 0);
        });

    });

});
