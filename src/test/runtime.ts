import { DeepPartial } from 'airtight';

import { FsModuleLoader } from '../main/fs/index.js';
import { GraphView } from '../main/runtime/GraphView.js';
import { ModuleLoader } from '../main/runtime/ModuleLoader.js';
import { GraphSpecSchema } from '../main/schema/GraphSpec.js';
import { GraphSpec } from '../main/types/index.js';

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

    createLoader() {
        const loader = new FsModuleLoader('./out/test/modules');
        return loader;
    }

    async loadGraph(spec: DeepPartial<GraphSpec>): Promise<GraphView> {
        const loader = this.createLoader();
        return this.loadGraphWithLoader(loader, spec);
    }

    async loadGraphWithLoader(loader: ModuleLoader, spec: DeepPartial<GraphSpec>) {
        const graphSpec = GraphSpecSchema.decode(spec);
        const graph = new GraphView(loader, graphSpec);
        await graph.loadRefs();
        return graph;
    }

}

export const runtime = new TestRuntime();
