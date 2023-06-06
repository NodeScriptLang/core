import path from 'node:path';

import { GenericModuleLoader } from '../runtime/ModuleLoader.js';
import { ModuleSpecSchema } from '../schema/ModuleSpec.js';

export class FsModuleLoader extends GenericModuleLoader {

    constructor(readonly baseDir: string) {
        super();
    }

    resolveComputeUrl(ref: string) {
        return `file://${path.resolve(this.baseDir, ref)}.js`;
    }

    async fetchModule(ref: string) {
        const url = this.resolveComputeUrl(ref);
        const { module } = await import(url);
        return ModuleSpecSchema.decode(module);
    }

}
