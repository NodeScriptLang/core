import assert from 'assert';

import { evaluateEscapes } from '../../main/util/index.js';

describe('evaluateEscapes', () => {

    it('replaces \\n with new line', () => {
        const input = 'Hello \\n World';
        const result = 'Hello \n World';
        assert.strictEqual(evaluateEscapes(input), result);
    });

    it('replaces \\t with trab', () => {
        const input = 'Hello \\t World';
        const result = 'Hello \t World';
        assert.strictEqual(evaluateEscapes(input), result);
    });

    it('does not replace \\\\n with new line', () => {
        const input = 'Hello \\\\n World';
        const result = 'Hello \\n World';
        assert.strictEqual(evaluateEscapes(input), result);
    });

    it('replaces \\xXX unicode escapes', () => {
        const input = 'Hello \\x0a World';
        const result = 'Hello \n World';
        assert.strictEqual(evaluateEscapes(input), result);
    });

    it('replaces \\uXXXX unicode escapes', () => {
        const input = 'Hello \\u000a World';
        const result = 'Hello \n World';
        assert.strictEqual(evaluateEscapes(input), result);
    });

    it('replaces \\u{XXXX} unicode escapes', () => {
        const input = 'Hello \\u{00000a} World';
        const result = 'Hello \n World';
        assert.strictEqual(evaluateEscapes(input), result);
    });

    it('replaces a few adjacent escapes', () => {
        const input = '\\u000a\\n\\t\\\\\\n';
        const result = '\n\n\t\\\n';
        assert.strictEqual(evaluateEscapes(input), result);
    });

});
