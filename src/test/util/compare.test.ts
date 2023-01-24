import assert from 'assert';

import { anyContains } from '../../main/util/compare.js';

describe('anyContains', () => {
    const scenarios = [
        {
            haystack: 'Hello World',
            needle: 'World',
            result: true,
        },
        {
            haystack: 'Hello World',
            needle: 'Yellow',
            result: false,
        },
        {
            haystack: 'Hello 42',
            needle: 42,
            result: true,
        },
        {
            haystack: { foo: 123 },
            needle: { foo: 123 },
            result: true,
        },
        {
            haystack: { foo: 123 },
            needle: 123,
            result: true,
        },
        {
            haystack: { foo: 123, bar: 345 },
            needle: { foo: 123 },
            result: true,
        },
        {
            haystack: { foo: 123, bar: 345 },
            needle: { foo: 123, bar: 345 },
            result: true,
        },
        {
            haystack: { foo: { bar: 123 } },
            needle: { foo: 123 },
            result: false,
        },
        {
            haystack: { foo: { bar: 123 } },
            needle: { bar: 123 },
            result: true,
        },
        {
            haystack: { foo: { bar: 123, baz: 345 } },
            needle: { bar: 123 },
            result: true,
        },
        {
            haystack: { foo: { bar: { baz: 345 } } },
            needle: { baz: 345 },
            result: true,
        },
        {
            haystack: { foo: { bar: { baz: 345 } } },
            needle: { bar: { baz: 345 } },
            result: true,
        },
        {
            haystack: { foo: { bar: { baz: 345 } } },
            needle: { foo: { baz: 345 } },
            result: false,
        },
        {
            haystack: ['one', 'two', 'three'],
            needle: 'two',
            result: true,
        },
        {
            haystack: ['one', 'two', 'three'],
            needle: ['one', 'two'],
            result: true,
        },
        {
            haystack: ['one', 'two', 'three'],
            needle: ['one', 'three'],
            result: false,
        },
        {
            haystack: ['one', 'two', 'three'],
            needle: ['two', 'three'],
            result: true,
        },
        {
            haystack: [{ foo: 123 }, { bar: 345 }],
            needle: { foo: 123 },
            result: true,
        },
        {
            haystack: [{ foo: 123 }, { bar: 345 }],
            needle: { foo: 123, bar: 345 },
            result: false,
        },
    ];

    for (const scenario of scenarios) {
        const title = [
            JSON.stringify(scenario.haystack),
            'contains',
            JSON.stringify(scenario.needle),
            '=',
            scenario.result,
        ].join(' ');
        it(title, () => {
            const result = anyContains(scenario.haystack, scenario.needle);
            assert.equal(scenario.result, result);
        });
    }
});
