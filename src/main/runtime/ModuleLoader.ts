import { ModuleSpecSchema } from '../schema/ModuleSpec.js';
import * as systemNodes from '../system/index.js';
import { ModuleDefinition, ModuleSpec } from '../types/index.js';

export interface ModuleLoader {
    resolveModuleUrl(moduleId: string): string;
    resolveComputeUrl(moduleId: string): string;
    resolveModule(moduleId: string): ModuleSpec;
    loadModule(moduleId: string): Promise<ModuleSpec>;
    addModule(module: ModuleSpec): void;
    removeModule(moduleId: string): void;
}

export class StandardModuleLoader implements ModuleLoader {
    modules = new Map<string, ModuleSpec>();
    registryUrl = 'https://registry.nodescript.dev';

    constructor() {
        this.addModule(systemNodes.Comment);
        this.addModule(systemNodes.Frame);
        this.addModule(systemNodes.Param);
        this.addModule(systemNodes.Result);
        this.addModule(systemNodes.EvalSync);
        this.addModule(systemNodes.EvalAsync);
        this.addModule(systemNodes.EvalJson);
    }

    resolveModuleUrl(moduleId: string) {
        return new URL(moduleId + '.json', this.registryUrl).toString();
    }

    resolveComputeUrl(moduleId: string): string {
        return new URL(moduleId + '.mjs', this.registryUrl).toString();
    }

    resolveModule(moduleId: string): ModuleSpec {
        return this.getModule(moduleId) ?? this.createUnresolved(moduleId);
    }

    async loadModule(moduleId: string): Promise<ModuleSpec> {
        const existing = this.getModule(moduleId);
        if (existing) {
            // Do not import twice
            return existing;
        }
        const moduleUrl = this.resolveModuleUrl(moduleId);
        const module = await this.fetchModule(moduleUrl);
        this.modules.set(moduleId, module);
        return module;
    }

    getModule(moduleId: string) {
        return this.modules.get(moduleId) ?? null;
    }

    addModule(def: ModuleDefinition | ModuleSpec): ModuleSpec {
        const spec: ModuleSpec = {
            labelParam: '',
            description: '',
            keywords: [],
            deprecated: '',
            hidden: false,
            cacheMode: 'auto',
            evalMode: 'auto',
            resizeMode: 'horizontal',
            attributes: {},
            ...def
        };
        this.modules.set(spec.moduleId, spec);
        return spec;
    }

    removeModule(moduleId: string): void {
        this.modules.delete(moduleId);
    }

    protected async fetchModule(url: string): Promise<ModuleSpec> {
        const res = await fetch(url);
        if (!res.ok) {
            throw new ModuleLoadFailedError(`Failed to load module ${url}: HTTP ${res.status}`, res.status);
        }
        const json = await res.json();
        return ModuleSpecSchema.decode(json);
    }

    protected createUnresolved(moduleId: string): ModuleSpec {
        return {
            moduleId: 'System.Unresolved',
            version: '0.0.0',
            label: 'Unresolved',
            labelParam: '',
            keywords: [],
            description: `Module ${moduleId} not found`,
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
                moduleId,
            },
        };
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
