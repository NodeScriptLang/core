// import assert from 'assert';
// import * as t from '../../main/types/model.js';
// import { Node } from '../../main/model/node.js';
import { assert } from 'console';
import { Graph } from '../../main/model/graph.js';
import { GraphLoader } from '../../main/runtime/loader.js';
import { runtime } from '../runtime.js';
// import { DeepPartial } from '../../main/types/deep-partial.js';

describe('Graph', () => {

    describe('createNode', () => {

        it('adds the node'); // create a node, call the func, check the node exists
        it('adds a URI to refs', async () => {
        // PLAN: create a uri, call the func, check the ref equals the uri
            const loader = new GraphLoader();
            const graph = await loader.loadGraph({
                nodes: [
                    { ref: 'n1' }
                ],
                refs: {
                    'n1': runtime.defs['math.add'],
                }
            });
            // 1. setup - your expected result
            const testUri = 'http://somekindofurl';
            // 2. exert - call the func being tested
            const res = await graph.createNode({ uri: testUri, node: { …nodeSpec }});
            const uri = res.$uri;
            // 3. verify - probably with an assert func
            assert.deepStrictEqual(uri, testUri);
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
