import { Graph } from '../main/model/graph.js';
import { GraphLoader } from '../main/runtime/loader.js';
import * as t from '../main/types/index.js';

/**
 * Test runtime utilities.
 * It has to be identical for each test case.
 *
 * Warning: if runtime is modified, make sure it is fully restored.
 */
export class TestRuntime {
    httpPort = Number(process.env.PORT) || 8080;

    defs = {
        'math.add': this.makeUrl('/out/test/defs/math.add.js'),
        'string': this.makeUrl('/out/test/defs/string.js'),
        'number': this.makeUrl('/out/test/defs/number.js'),
        'object': this.makeUrl('/out/test/defs/object.js'),
        'array': this.makeUrl('/out/test/defs/array.js'),
        'any': this.makeUrl('/out/test/defs/any.js'),
    };

    makeUrl(path: string) {
        return `http://127.0.0.1:${this.httpPort}${path}`;
    }

    async createLoader() {
        const loader = new GraphLoader();
        for (const uri of Object.values(this.defs)) {
            await loader.loadNodeDef(uri);
        }
        return loader;
    }

    async loadGraph(spec: t.GraphSpec): Promise<Graph> {
        const loader = await this.createLoader();
        const graph = await loader.loadGraph(spec);
        return graph;
    }
}

export const runtime = new TestRuntime();
