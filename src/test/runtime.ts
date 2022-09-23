import { DeepPartial } from 'airtight';

import { Graph } from '../main/model/index.js';
import { GraphSpec } from '../main/types/index.js';
import { TestGraphLoader } from './test-loader.js';

/**
 * Test runtime utilities.
 * It has to be identical for each test case.
 *
 * Warning: if runtime is modified, make sure it is fully restored.
 */
export class TestRuntime {
    httpPort = Number(process.env.PORT) || 8085;

    defs = {
        'string': this.makeUrl('/out/test/defs/string.js'),
        'number': this.makeUrl('/out/test/defs/number.js'),
        'object': this.makeUrl('/out/test/defs/object.js'),
        'array': this.makeUrl('/out/test/defs/array.js'),
        'any': this.makeUrl('/out/test/defs/any.js'),
        'promise': this.makeUrl('/out/test/defs/promise.js'),
        'eval': this.makeUrl('/out/test/defs/eval.js'),
        'math.add': this.makeUrl('/out/test/defs/math.add.js'),
        'lambda.map': this.makeUrl('/out/test/defs/lambda.map.js'),
        'param.default': this.makeUrl('/out/test/defs/param.default.js'),
    };

    makeUrl(path: string) {
        return `http://127.0.0.1:${this.httpPort}${path}`;
    }

    async createLoader() {
        const loader = new TestGraphLoader();
        for (const url of Object.values(this.defs)) {
            await loader.loadModule(url);
        }
        return loader;
    }

    async loadGraph(spec: DeepPartial<GraphSpec>): Promise<Graph> {
        const loader = await this.createLoader();
        const graph = await loader.loadGraph(spec);
        return graph;
    }
}

export const runtime = new TestRuntime();
