import { DeepPartial } from 'airtight';

import { GraphView } from '../main/runtime/GraphView.js';
import { GraphSpecSchema } from '../main/schema/GraphSpec.js';
import { GraphSpec } from '../main/types/index.js';
import { TestModuleLoader } from './test-loader.js';

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
        const loader = new TestModuleLoader();
        return loader;
    }

    async loadGraph(spec: DeepPartial<GraphSpec>): Promise<GraphView> {
        const loader = await this.createLoader();
        const graphSpec = GraphSpecSchema.decode(spec);
        const graph = new GraphView(loader, graphSpec);
        await graph.loadRefs();
        return graph;
    }
}

export const runtime = new TestRuntime();
