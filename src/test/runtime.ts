import { GraphLoader } from '../main/runtime/loader.js';

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
}

export const runtime = new TestRuntime();
