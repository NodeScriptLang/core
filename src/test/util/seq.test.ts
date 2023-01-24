import assert from 'assert';

import { seqContains, seqEndsWith, seqStartsWith } from '../../main/util/seq.js';

describe('seqStartsWith', () => {
    it('array positive', () => {
        assert.ok(seqStartsWith(['a', 'b', 'c'], ['a', 'b']));
    });

    it('array negative', () => {
        assert.ok(!seqStartsWith(['a', 'b', 'c'], ['b', 'c']));
    });

    it('empty needle', () => {
        assert.ok(seqStartsWith(['a', 'b', 'c'], []));
    });

    it('too big needle', () => {
        assert.ok(!seqStartsWith(['a', 'b', 'c'], ['a', 'b', 'c', 'd']));
    });

    it('same arrays', () => {
        assert.ok(seqStartsWith(['a', 'b', 'c'], ['a', 'b', 'c']));
    });
});

describe('seqEndsWith', () => {
    it('array positive', () => {
        assert.ok(seqEndsWith(['a', 'b', 'c'], ['b', 'c']));
    });

    it('array negative', () => {
        assert.ok(!seqEndsWith(['a', 'b', 'c'], ['a', 'b']));
    });

    it('empty needle', () => {
        assert.ok(seqEndsWith(['a', 'b', 'c'], []));
    });

    it('too big needle', () => {
        assert.ok(!seqEndsWith(['a', 'b', 'c'], ['a', 'b', 'c', 'd']));
    });

    it('same arrays', () => {
        assert.ok(seqEndsWith(['a', 'b', 'c'], ['a', 'b', 'c']));
    });
});

describe('seqContains', () => {
    it('array positive', () => {
        assert.ok(seqContains(['a', 'b', 'c'], ['b', 'c']));
    });

    it('array negative', () => {
        assert.ok(!seqContains(['a', 'b', 'c'], ['a', 'c']));
    });

    it('empty needle', () => {
        assert.ok(seqContains(['a', 'b', 'c'], []));
    });

    it('too big needle', () => {
        assert.ok(!seqContains(['a', 'b', 'c'], ['a', 'b', 'c', 'd']));
    });

    it('same arrays', () => {
        assert.ok(seqContains(['a', 'b', 'c'], ['a', 'b', 'c']));
    });
});
