import assert from 'assert';

import { toRegExp } from '../../main/util/regexp.js';

describe('toRegExp', () => {

    context('string argument', () => {

        it('returns regular expression with g flag by default', () => {
            const expr = '^[a-z]+$';
            assert.strictEqual(toRegExp(expr) instanceof RegExp, true);
            assert.strictEqual(toRegExp(expr).flags, 'g');
            assert.ok(toRegExp(expr).test('abc'));
            assert.ok(!toRegExp(expr).test('AbC'));
            assert.ok(!toRegExp(expr).test('123'));
        });

        it('returns regular expression with specified flags', () => {
            const expr = '(?i:^[a-z]+$)';
            assert.strictEqual(toRegExp(expr) instanceof RegExp, true);
            assert.strictEqual(toRegExp(expr).flags, 'i');
            assert.ok(toRegExp(expr).test('abc'));
            assert.ok(toRegExp(expr).test('AbC'));
            assert.ok(!toRegExp(expr).test('123'));
        });

    });

});
