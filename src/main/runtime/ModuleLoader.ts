import { ModuleSpecSchema } from '../schema/ModuleSpec.js';
import * as systemNodes from '../system/index.js';
import { ModuleSpec } from '../types/index.js';

export interface ModuleLoader {
    resolveComputeUrl(ref: string): string;
    resolveModule(ref: string): ModuleSpec;
    getModule(ref: string): ModuleSpec | null;
    loadModule(ref: string): Promise<ModuleSpec>;
}

export abstract class GenericModuleLoader implements ModuleLoader {
    modules = new Map<string, ModuleSpec>();

    constructor() {
        this.addModule(systemNodes.Comment);
        this.addModule(systemNodes.Frame);
        this.addModule(systemNodes.Param);
        this.addModule(systemNodes.Result);
        this.addModule(systemNodes.EvalSync);
        this.addModule(systemNodes.EvalAsync);
        this.addModule(systemNodes.EvalJson);
    }

    abstract resolveComputeUrl(ref: string): string;
    abstract fetchModule(ref: string): Promise<ModuleSpec>;

    resolveModule(ref: string): ModuleSpec {
        return this.getModule(ref) ?? this.createUnresolved(ref);
    }

    getModule(ref: string) {
        return this.modules.get(ref) ?? null;
    }

    async loadModule(ref: string): Promise<ModuleSpec> {
        const existing = this.getModule(ref);
        if (existing) {
            // Do not import twice
            return existing;
        }
        const module = await this.fetchModule(ref);
        this.modules.set(ref, module);
        return module;
    }

    addModule(def: ModuleSpec): ModuleSpec {
        this.modules.set(def.moduleId, def);
        return def;
    }

    removeModule(ref: string): void {
        this.modules.delete(ref);
    }

    createUnresolved(ref: string): ModuleSpec {
        return {
            moduleId: 'System.Unresolved',
            moduleName: 'Unresolved',
            version: '0.0.0',
            labelParam: '',
            keywords: [],
            description: `Module ${ref} not found`,
            deprecated: '',
            hidden: true,
            params: {},
            result: {
                schema: { type: 'any' },
            },
            cacheMode: 'auto',
            evalMode: 'auto',
            resizeMode: 'horizontal',
            attributes: {
                ref,
            },
        };
    }

}

export class StandardModuleLoader extends GenericModuleLoader {
    registryUrl = 'https://registry.nodescript.dev';

    resolveModuleUrl(ref: string) {
        return new URL(ref + '.json', this.registryUrl).toString();
    }

    resolveComputeUrl(ref: string): string {
        return new URL(ref + '.mjs', this.registryUrl).toString();
    }

    async fetchModule(ref: string): Promise<ModuleSpec> {
        const url = this.resolveModuleUrl(ref);
        const res = await fetch(url);
        if (!res.ok) {
            throw new ModuleLoadFailedError(`Failed to load module ${ref}: HTTP ${res.status}`, res.status);
        }
        const json = await res.json();
        return ModuleSpecSchema.decode(json);
    }

}

export class UnresolvedNodeError extends Error {
    override name = this.constructor.name;
    status = 500;
}

export class ModuleLoadFailedError extends Error {
    override name = this.constructor.name;

    constructor(override readonly message: string, readonly status = 500) {
        super(message);
    }
}
