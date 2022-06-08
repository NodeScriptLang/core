describe('Graph', () => {

    describe('createNode', () => {

        it('adds the node');
        it('adds a URI to refs');
        it('does not add the same URI twice');

    });


    describe('deleteNode', () => {

        it('removes the node');
        it('removes unused refs');
        it('does not remove used refs');

    });

    describe('invariants', () => {

        it('removes extra properties not supported by node definition');
        it('ensures the correct order properties');
        it('initializes all properties with default values');

    });

});
