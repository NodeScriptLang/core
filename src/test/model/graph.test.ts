import assert from 'assert';

import { GraphLoader } from '../../main/runtime/loader.js';
import { runtime } from '../runtime.js';

describe('Graph', () => {

    describe('createNode', () => {

        it('adds the node to the graph', async () => {
            const loader = new GraphLoader();
            const graph = await loader.loadGraph();
            assert.strictEqual(graph.nodes.length, 0);
            const node = await graph.createNode({
                uri: runtime.defs['any'],
                node: {},
            });
            assert.ok(node);
            assert.strictEqual(graph.nodes.length, 1);
            assert.strictEqual(graph.nodes[0], node);
        });

        it('adds a URI to refs', async () => {
            const loader = new GraphLoader();
            const graph = await loader.loadGraph();
            assert.strictEqual(Object.keys(graph.refs).length, 0);
            const uri = runtime.defs['math.add'];
            const node = await graph.createNode({
                uri,
                node: {},
            });
            assert.strictEqual(Object.keys(graph.refs).length, 1);
            assert.strictEqual(graph.refs[node.ref], uri);
        });

        it('does not add the same URI twice', async () => {
            const loader = new GraphLoader();
            const graph = await loader.loadGraph();
            assert.strictEqual(Object.keys(graph.refs).length, 0);
            const uri = runtime.defs['math.add'];
            const node1 = await graph.createNode({
                uri,
                node: {},
            });
            const node2 = await graph.createNode({
                uri,
                node: {},
            });
            assert.strictEqual(Object.keys(graph.refs).length, 1);
            assert.strictEqual(graph.refs[node1.ref], uri);
            assert.strictEqual(graph.refs[node1.ref], graph.refs[node2.ref]);
        });

        it('different URIs will save to different refs', async () => {
            const loader = new GraphLoader();
            const graph = await loader.loadGraph();
            assert.strictEqual(Object.keys(graph.refs).length, 0);
            const uri1 = runtime.defs['math.add'];
            const uri2 = runtime.defs['any'];
            const node1 = await graph.createNode({
                uri: uri1,
                node: {},
            });
            const node2 = await graph.createNode({
                uri: uri2,
                node: {},
            });
            assert.strictEqual(Object.keys(graph.refs).length, 2);
            assert.notEqual(graph.refs[node1.ref], graph.refs[node2.ref]);
        });

    });

    describe('deleteNode', () => {

        it('removes the correct node', async () => {
            const loader = new GraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'a', linkId: 'p' },
                            { key: 'b', linkId: 'p' },
                        ]
                    },
                    {
                        id: 'p',
                        ref: 'string',
                        props: [
                            { key: 'value', value: '42' },
                        ]
                    }
                ],
                refs: {
                    add: runtime.defs['math.add'],
                    string: runtime.defs['string'],
                }
            });
            assert.strictEqual(Object.keys(graph.nodes).length, 2);
            graph.deleteNode('res');
            assert.strictEqual(Object.keys(graph.nodes).length, 1);
            assert.strictEqual(graph.nodes[0]['id'], 'p');
        });

        it('only removes unused refs', async () => {
            const loader = new GraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'a', linkId: 'p' },
                            { key: 'b', linkId: 'p' },
                        ]
                    },
                    {
                        id: 'p',
                        ref: 'string',
                        props: [
                            { key: 'value', value: '42' },
                        ]
                    }
                ],
                refs: {
                    add: runtime.defs['math.add'],
                    string: runtime.defs['string'],
                }
            });
            assert.strictEqual(Object.keys(graph.nodes).length, 2);
            assert.strictEqual(Object.keys(graph.refs).length, 2);
            graph.deleteNode('res');
            assert.strictEqual(Object.keys(graph.nodes).length, 1);
            assert.strictEqual(Object.keys(graph.refs).length, 1);
            assert.strictEqual(Object.keys(graph.refs)[0], 'string');
        });

    });

    describe('invariants', () => {

        it('removes extra properties not supported by node definition', async () => {
            const loader = new GraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'c', value: '10' },
                            { key: 'a', value: '12' },
                            { key: 'b', value: '21' },
                        ]
                    }
                ],
                refs: {
                    add: runtime.defs['math.add'],
                }
            });
            const node = graph.getNodeById('res');
            assert.strictEqual(node?.props.length, 2);
            assert.strictEqual(node?.props[0].key, 'a');
            assert.strictEqual(node?.props[1].key, 'b');
        });

        it('keeps firstmost properties when extra properties are present', async () => {
            const loader = new GraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'p',
                        ref: 'string',
                        props: [
                            { key: 'value', value: '42' },
                            { key: 'value', value: '68' },
                        ]
                    }
                ],
                refs: {
                    string: runtime.defs['string'],
                }
            });
            const node = graph.getNodeById('p');
            assert.strictEqual(node?.props.length, 1);
            assert.strictEqual(node?.props[0].value, '42');
        });

        it('ensures the correct order of properties', async () => {
            const loader = new GraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'res',
                        ref: 'add',
                        props: [
                            { key: 'b', value: '21' },
                            { key: 'a', value: '12' },
                        ]
                    }
                ],
                refs: {
                    add: runtime.defs['math.add'],
                }
            });
            const node = graph.getNodeById('res');
            assert.strictEqual(node?.props[0].key, 'a');
            assert.strictEqual(node?.props[1].key, 'b');
        });

        it('initializes all node properties with default values', async () => {
            const loader = new GraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'res',
                        ref: 'add',
                    }
                ],
                refs: {
                    add: runtime.defs['math.add'],
                }
            });
            const node = graph.getNodeById('res');
            assert.strictEqual(node?.props.length, 2);
            assert.strictEqual(node?.props[0].key, 'a');
            assert.strictEqual(node?.props[1].key, 'b');
        });

    });

    describe('removeLink', () => { */

        it.skip('removes second link of two looped nodes', async () => {
            const loader = new GraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    {
                        id: 'res',
                        ref: 'string',
                        props: [
                            { key: 'value', value: '42', linkId: 'p' },
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
                    string: runtime.defs['string']
                }
            });
            const node1 = graph.getNodeById('res');
            const node2 = graph.getNodeById('p');
            assert.strictEqual(node1?.props[0].linkId, 'p');
            assert.strictEqual(node2?.props[0].linkId, '');
        });

    });

});
