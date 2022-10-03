import { DeepPartial } from '@flexent/schema';

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

    makeUrl(path: string) {
        return `http://127.0.0.1:${this.httpPort}${path}`;
    }

    async createLoader() {
        const loader = new TestGraphLoader();
        return loader;
    }

    async loadGraph(spec: DeepPartial<GraphSpec>): Promise<Graph> {
        const loader = await this.createLoader();
        const graph = await Graph.load(loader, spec);
        return graph;
    }
}

export const runtime = new TestRuntime();
