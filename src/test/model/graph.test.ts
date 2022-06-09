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

        // it('does not create a node with the wrong type of URI');
    });


    describe('deleteNode', () => {

        it('removes the node'); // create, a graph, create a node, test the delete func on this new node, then check if the node is still existing .length 0 (create graph with node in it)
        it('removes unused refs'); // **not yet implemented** create a ref that is unused, call the delete on this ref, check the ref is not there.
        it('does not remove used refs'); // **not yet implemented**create a ref that is used, call the delete on this ref, check the ref is still there.

    });

    describe('invariants', () => {

        it('removes extra properties not supported by node definition');
        it('ensures the correct order properties');
        it('initializes all properties with default values');

    });

});
