import assert from 'assert';

import { TestGraphLoader } from '../test-loader.js';

describe('Graph', () => {

    describe('createNode', () => {

        it('adds the node to the graph', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({});
            assert.strictEqual(graph.nodes.length, 0);
            const node = await graph.createNode({
                ref: 'Any',
            });
            assert.ok(node);
            assert.strictEqual(graph.nodes.length, 1);
            assert.strictEqual(graph.nodes[0], node);
        });

        it('sets the default param value if not explicitly specified', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({});
            const node = await graph.createNode({
                ref: 'Param.Default',
            });
            assert.strictEqual(node.props[0].key, 'value');
            assert.strictEqual(node.props[0].value, 'Hello');
        });

        it('sets the actual param value when explicitly specified', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({});
            const node = await graph.createNode({
                ref: 'Param.Default',
                props: [
                    { key: 'value', value: 'Bye' }
                ]
            });
            assert.strictEqual(node.props[0].key, 'value');
            assert.strictEqual(node.props[0].value, 'Bye');
        });

    });

    describe('deleteNode', () => {

        it('removes the node', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'res',
                        ref: 'Math.Add',
                        props: [
                            { key: 'a', linkId: 'p' },
                            { key: 'b', linkId: 'p' },
                        ]
                    },
                    {
                        id: 'p',
                        ref: 'String',
                        props: [
                            { key: 'value', value: '42' },
                        ]
                    }
                ]
            });
            assert.strictEqual(Object.keys(graph.nodes).length, 2);
            graph.deleteNode('res');
            assert.strictEqual(Object.keys(graph.nodes).length, 1);
            assert.strictEqual(graph.nodes[0]['id'], 'p');
        });

    });

    describe('detachNode', () => {

        it('recreates the links attached to the first property', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'res',
                        ref: 'Any',
                        props: [
                            { key: 'value', linkId: 'add' },
                        ]
                    },
                    {
                        id: 'obj',
                        ref: 'Object',
                        props: [
                            {
                                key: 'properties',
                                entries: [
                                    { key: 'foo', linkId: 'add' },
                                    { key: 'bar', linkId: 'add' },
                                ]
                            },
                        ]
                    },
                    {
                        id: 'add',
                        ref: 'Math.Add',
                        props: [
                            { key: 'a', linkId: 'a' },
                            { key: 'b', linkId: 'b' },
                        ]
                    },
                    {
                        id: 'a',
                        ref: 'Number',
                        props: [
                            { key: 'value', value: '42' },
                        ]
                    },
                    {
                        id: 'b',
                        ref: 'Number',
                        props: [
                            { key: 'value', value: '37' },
                        ]
                    }
                ],
            });
            const resNode = graph.getNodeById('res')!;
            assert.strictEqual(resNode.props[0].linkId, 'add');
            graph.detachNode('add');
            assert.strictEqual(resNode.props[0].linkId, 'a');
            const objNode = graph.getNodeById('obj')!;
            assert.strictEqual(objNode.props[0].entries[0].linkId, 'a');
            assert.strictEqual(objNode.props[0].entries[1].linkId, 'a');
        });

        it('recreates the links through the first connected entry', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'res',
                        ref: 'Any',
                        props: [
                            { key: 'value', linkId: 'obj' },
                        ]
                    },
                    {
                        id: 'obj',
                        ref: 'Object',
                        props: [
                            {
                                key: 'properties',
                                entries: [
                                    { key: 'foo', linkId: 'a' },
                                    { key: 'bar', linkId: 'b' },
                                ]
                            },
                        ]
                    },
                    {
                        id: 'a',
                        ref: 'Number',
                        props: [
                            { key: 'value', value: '42' },
                        ]
                    },
                    {
                        id: 'b',
                        ref: 'Number',
                        props: [
                            { key: 'value', value: '37' },
                        ]
                    }
                ],
            });
            const resNode = graph.getNodeById('res')!;
            assert.strictEqual(resNode.props[0].linkId, 'obj');
            graph.detachNode('obj');
            assert.strictEqual(resNode.props[0].linkId, 'a');
        });

    });

    describe('invariants', () => {

        it('removes extra properties not supported by node definition', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'res',
                        ref: 'Math.Add',
                        props: [
                            { key: 'c', value: '10' },
                            { key: 'a', value: '12' },
                            { key: 'b', value: '21' },
                        ]
                    }
                ]
            });
            const node = graph.getNodeById('res');
            assert.strictEqual(node?.props.length, 2);
            assert.strictEqual(node?.props[0].key, 'a');
            assert.strictEqual(node?.props[1].key, 'b');
        });

        it('keeps firstmost properties when extra properties are present', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'p',
                        ref: 'String',
                        props: [
                            { key: 'value', value: '42' },
                            { key: 'value', value: '68' },
                        ]
                    }
                ]
            });
            const node = graph.getNodeById('p');
            assert.strictEqual(node?.props.length, 1);
            assert.strictEqual(node?.props[0].value, '42');
        });

        it('ensures the correct order of properties', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'res',
                        ref: 'Math.Add',
                        props: [
                            { key: 'b', value: '21' },
                            { key: 'a', value: '12' },
                        ]
                    }
                ]
            });
            const node = graph.getNodeById('res');
            assert.strictEqual(node?.props[0].key, 'a');
            assert.strictEqual(node?.props[1].key, 'b');
        });

        it('initializes all node properties with default values', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'res',
                        ref: 'Math.Add',
                    }
                ]
            });
            const node = graph.getNodeById('res');
            assert.strictEqual(node?.props.length, 2);
            assert.strictEqual(node?.props[0].key, 'a');
            assert.strictEqual(node?.props[1].key, 'b');
        });

        it('removes the first link of two looped nodes', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'res',
                        ref: 'String',
                        props: [
                            { key: 'value', value: '42', linkId: 'p' },
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
            const node1 = graph.getNodeById('res');
            const node2 = graph.getNodeById('p');
            assert.strictEqual(node1?.props[0].linkId, '');
            assert.strictEqual(node2?.props[0].linkId, 'res');
        });

        it('sets module.result.async = false when all nodes are sync', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    { ref: 'Math.Add' },
                    { ref: 'String' },
                ],
            });
            assert.strictEqual(graph.moduleSpec.result.async, false);
        });

        it('sets module.result.async = true if at least one node is async', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    { ref: 'Math.Add' },
                    { ref: 'String' },
                    { ref: 'Promise' },
                ],
            });
            assert.strictEqual(graph.moduleSpec.result.async, true);
        });

    });

    describe('setRootNode', () => {

        it('updates graph.metadata.result schema to match the result type of node', async () => {
            const loader = new TestGraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    { id: 'add', ref: 'Math.Add' },
                    { id: 'string', ref: 'String' },
                ],
            });
            assert.deepStrictEqual(graph.moduleSpec.result.schema, { type: 'any' });
            graph.setRootNode('add');
            assert.deepStrictEqual(graph.moduleSpec.result.schema, { type: 'number' });
            graph.setRootNode('string');
            assert.deepStrictEqual(graph.moduleSpec.result.schema, { type: 'string' });
            graph.setRootNode(null);
            assert.deepStrictEqual(graph.moduleSpec.result.schema, { type: 'any' });
        });

    });

});
