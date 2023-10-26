import assert from 'assert';

import { convertAnyVal } from '../../main/util/index.js';

describe('convertAnyVal', () => {

    it(`converts '' to ''`, () => {
        const input = '';
        let result;
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts 'undefined' to undefined'`, () => {
        const input = 'undefined';
        const result = undefined;
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts "''" to ''`, () => {
        const input = `''`;
        const result = '';
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts '""' to ""`, () => {
        const input = `""`;
        const result = '';
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts 'null' to null`, () => {
        const input = 'null';
        const result = null;
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts 'true' to true`, () => {
        const input = 'true';
        const result = true;
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts 'false' to false`, () => {
        const input = 'false';
        const result = false;
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts '{}' to {}`, () => {
        const input = '{}';
        const result = {};
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts '[]' to []`, () => {
        const input = '[]';
        const result: any = [];
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts 'd12.34' to 'd12.34'`, () => {
        const input = 'd12.34';
        const result: any = 'd12.34';
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts '/12.34' to '/12.34'`, () => {
        const input = '/12.34';
        const result: any = '/12.34';
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts '12.34' to 12.34`, () => {
        const input = '12.34';
        const result: any = 12.34;
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts '-12.34' to -12.34`, () => {
        const input = '-12.34';
        const result: any = -12.34;
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts '+12.34' to 12.34`, () => {
        const input = '+12.34';
        const result: any = 12.34;
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts '1e20' to 100000000000000000000`, () => {
        const input = '1e20';
        const result: any = 100000000000000000000;
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts '1e+20' to 100000000000000000000`, () => {
        const input = '1e+20';
        const result: any = 100000000000000000000;
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts '1e30' to 1e+30`, () => {
        const input = '1e30';
        const result: any = 1e+30;
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts '1e-5' to 0.00001`, () => {
        const input = '1e-5';
        const result: any = 0.00001;
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts '1e-40' to 1e-40`, () => {
        const input = '1e-40';
        const result: any = 1e-40;
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts '0xf00d' to 61453`, () => {
        const input = '0xf00d';
        const result: any = 61453;
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

    it(`converts '0x0' to 0`, () => {
        const input = '0x0';
        const result: any = 0;
        assert.deepStrictEqual(convertAnyVal(input), result);
    });

});
