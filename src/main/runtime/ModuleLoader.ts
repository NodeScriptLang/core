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
        this.addModule('@system/Comment', systemNodes.Comment);
        this.addModule('@system/Frame', systemNodes.Frame);
        this.addModule('@system/Param', systemNodes.Param);
        this.addModule('@system/Result', systemNodes.Output);
        this.addModule('@system/Input', systemNodes.Input);
        this.addModule('@system/Output', systemNodes.Output);
        this.addModule('@system/EvalSync', systemNodes.EvalSync);
        this.addModule('@system/EvalAsync', systemNodes.EvalAsync);
        this.addModule('@system/EvalJson', systemNodes.EvalJson);
        this.addModule('@system/Subgraph', systemNodes.Subgraph);
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

    addModule(moduleRef: string, moduleSpec: ModuleSpec): ModuleSpec {
        this.modules.set(moduleRef, moduleSpec);
        return moduleSpec;
    }

    removeModule(ref: string): void {
        this.modules.delete(ref);
    }

    createUnresolved(ref: string): ModuleSpec {
        return {
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
            newScope: false,
            cacheMode: 'auto',
            evalMode: 'auto',
            resizeMode: 'horizontal',
            hideEvalControls: false,
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
