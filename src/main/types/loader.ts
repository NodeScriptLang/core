import { ModuleSpec } from './module.js';

export interface GraphLoader {
    loadModule(url: string): Promise<ModuleSpec>;
    resolveModule(url: string): ModuleSpec;
}
