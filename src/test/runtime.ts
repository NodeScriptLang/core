/**
 * Test runtime utilities.
 * It has to be identical for each test case.
 *
 * Warning: if runtime is modified, make sure it is fully restored.
 */
export class TestRuntime {
    httpPort = Number(process.env.PORT) || 8080;

    makeUrl(path: string) {
        return `http://127.0.0.1:${this.httpPort}${path}`;
    }
}

export const runtime = new TestRuntime();
