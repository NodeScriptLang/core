import { ModuleSpecSchema } from '../schema/ModuleSpec.js';
import * as systemNodes from '../system/index.js';
import { ModuleDefinition, ModuleSpec } from '../types/index.js';

export interface ModuleLoader {
    resolveModuleUrl(moduleName: string): string;
    resolveComputeUrl(moduleName: string): string;
    resolveModule(moduleName: string): ModuleSpec;
    loadModule(moduleName: string): Promise<ModuleSpec>;
    addModule(module: ModuleSpec): void;
    removeModule(moduleName: string): void;
}

export class StandardModuleLoader implements ModuleLoader {
    modules = new Map<string, ModuleSpec>();
    registryUrl = 'https://registry.nodescript.dev';

    constructor() {
        this.addModule(systemNodes.Comment);
        this.addModule(systemNodes.Frame);
        this.addModule(systemNodes.Local);
        this.addModule(systemNodes.Param);
        this.addModule(systemNodes.EvalSync);
        this.addModule(systemNodes.EvalAsync);
        this.addModule(systemNodes.EvalJson);
    }

    resolveModuleUrl(moduleName: string) {
        return new URL(moduleName + '.json', this.registryUrl).toString();
    }

    resolveComputeUrl(moduleName: string): string {
        return new URL(moduleName + '.mjs', this.registryUrl).toString();
    }

    resolveModule(moduleName: string): ModuleSpec {
        return this.getModule(moduleName) ?? this.createUnresolved(moduleName);
    }

    async loadModule(moduleName: string): Promise<ModuleSpec> {
        const existing = this.getModule(moduleName);
        if (existing) {
            // Do not import twice
            return existing;
        }
        const moduleUrl = this.resolveModuleUrl(moduleName);
        const module = await this.fetchModule(moduleUrl);
        this.modules.set(moduleName, module);
        return module;
    }

    getModule(moduleName: string) {
        return this.modules.get(moduleName) ?? null;
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
            ...def
        };
        this.modules.set(spec.moduleName, spec);
        return spec;
    }

    removeModule(moduleName: string): void {
        this.modules.delete(moduleName);
    }

    protected async fetchModule(url: string): Promise<ModuleSpec> {
        const res = await fetch(url);
        if (!res.ok) {
            throw new ModuleLoadFailedError(`Failed to load module ${url}: HTTP ${res.status}`, res.status);
        }
        const json = await res.json();
        return ModuleSpecSchema.decode(json);
    }

    protected createUnresolved(moduleName: string): ModuleSpec {
        return {
            moduleName: 'System.Unresolved',
            version: '0.0.0',
            label: 'Unresolved',
            labelParam: '',
            keywords: [],
            description: `Module ${moduleName} not found`,
            deprecated: '',
            hidden: true,
            params: {},
            result: {
                schema: { type: 'any' },
            },
            cacheMode: 'auto',
            evalMode: 'auto',
            resizeMode: 'horizontal',
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
