import { StandardGraphLoader } from '../main/model/GraphLoader.js';
import { ModuleSpecSchema } from '../main/schema/ModuleSpec.js';
import { ModuleSpec } from '../main/types/module.js';

/**
 * Custom module loader for tests.
 *
 * Loads the module from out/test/defs directory using `await import`.
 * This is just to save hassle of pre-bundling test module definitions.
 */
export class TestGraphLoader extends StandardGraphLoader {

    protected async fetchModule(url: string): Promise<ModuleSpec> {
        const { module } = await import(url);
        return ModuleSpecSchema.decode(module);
    }

}
