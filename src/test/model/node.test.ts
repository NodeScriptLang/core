import assert from 'assert';

import { GraphLoader } from '../../main/runtime/loader.js';
import { runtime } from '../runtime.js';

describe('Node', () => {

    describe('canLinkTo', () => {

        it('specifies whether a property is linkable or not', async () => {
            const loader = new GraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'res',
                        ref: 'string',
                        props: [
                            { key: 'value', value: '42' },
                        ]
                    },
                    {
                        id: 'p',
                        ref: 'string',
                        props: [
                            { key: 'value', value: '42', linkId: 'res' },
                        ]
                    }
                ],
                refs: {
                    string: runtime.defs['string'],
                }
            });
            const node1 = graph.getNodeById('res');
            const node2 = graph.getNodeById('p');
            const res1 = node2 ? node1?.canLinkTo(node2) : null;
            const res2 = node1 ? node2?.canLinkTo(node1) : null;
            assert.strictEqual(res1, true);
            assert.strictEqual(res2, false);
        });

    });

    describe('addPropEntry', () => {

        it('adds an entry to supported properties', async () => {
            const loader = new GraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'obj',
                        ref: 'object',
                        props: [
                            { key: 'properties' },
                        ]
                    },
                    {
                        id: 'arr',
                        ref: 'array',
                        props: [
                            { key: 'items' },
                        ]
                    },
                    {
                        id: 'str',
                        ref: 'string',
                        props: [
                            { key: 'value' },
                        ]
                    }
                ],
                refs: {
                    object: runtime.defs['object'],
                    array: runtime.defs['array'],
                    string: runtime.defs['string'],
                }
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
            const loader = new GraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'obj',
                        ref: 'object',
                        props: [
                            {
                                key: 'properties',
                                entries: [
                                    { id: 'test', key: 'foo', expand: true },
                                ]
                            }
                        ]
                    },
                ],
                refs: {
                    object: runtime.defs['object'],
                }
            });
            const node = graph.getNodeById('obj');
            assert.strictEqual(node?.props[0].entries.length, 1);
            node?.removePropEntry('properties', 'test');
            assert.strictEqual(node?.props[0].entries.length, 0);
        });

    });

});
