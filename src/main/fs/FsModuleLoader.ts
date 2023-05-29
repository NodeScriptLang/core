import path from 'node:path';

import { GenericModuleLoader } from '../runtime/ModuleLoader.js';

export class FsModuleLoader extends GenericModuleLoader {

    constructor(readonly baseDir: string) {
        super();
    }

    resolveComputeUrl(ref: string) {
        return `file://${path.resolve(this.baseDir, ref)}.js`;
    }

}
