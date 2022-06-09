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

        it('does not add the same URI twice'); // create node with a uri, call func with same uri, check that the uri is not the same? or that there are not two of them? how? - look at node structure
    });


    describe('deleteNode', () => {

        it('removes the node'); // create a node, test the delete on this new node, then check if the node is still existing
        it('removes unused refs'); // create a ref that is unused, call the delete on this ref, check the ref is not there.
        it('does not remove used refs'); // create a ref that is used, call the delete on this ref, check the ref is still there.

    });

    describe('invariants', () => {

        it('removes extra properties not supported by node definition');
        it('ensures the correct order properties');
        it('initializes all properties with default values');

    });

});
