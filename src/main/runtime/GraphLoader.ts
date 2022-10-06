import { DeepPartial } from '@flexent/schema';

import { GraphSpecSchema } from '../schema/GraphSpec.js';
import { ModuleSpecSchema } from '../schema/ModuleSpec.js';
import * as systemNodes from '../system/index.js';
import { GraphSpec, ModuleDefinition, ModuleSpec } from '../types/index.js';
import { GraphView } from './GraphView.js';

export interface GraphLoaderOptions {
    ignoreFailedDefs?: boolean;
}

export interface GraphLoader {
    loadGraph(spec: DeepPartial<GraphSpec>, options?: GraphLoaderOptions): Promise<GraphView>;
    resolveModuleUrl(moduleName: string): string;
    resolveComputeUrl(moduleName: string): string;
    resolveModule(moduleName: string): ModuleSpec;
    loadModule(moduleName: string): Promise<ModuleSpec>;
}

export class StandardGraphLoader implements GraphLoader {
    modules = new Map<string, ModuleSpec>();
    registryUrl = 'https://registry.nodescript.dev';

    constructor() {
        this.defineModule('@system/Comment', systemNodes.Comment);
        this.defineModule('@system/Frame', systemNodes.Frame);
        this.defineModule('@system/Local', systemNodes.Local);
        this.defineModule('@system/Param', systemNodes.Param);
        this.defineModule('@system/EvalSync', systemNodes.EvalSync);
        this.defineModule('@system/EvalAsync', systemNodes.EvalAsync);
        this.defineModule('@system/EvalJson', systemNodes.EvalJson);
    }

    async loadGraph(spec: DeepPartial<GraphSpec>, options: GraphLoaderOptions = {}): Promise<GraphView> {
        const graphSpec = GraphSpecSchema.decode(spec);
        const allRefs = Object.values(graphSpec.nodes).map(_ => _.ref);
        const uniqueRefs = new Set(allRefs);
        const promises = [];
        for (const moduleName of uniqueRefs) {
            const promise = this.loadModule(moduleName)
                .catch(error => {
                    if (options.ignoreFailedDefs) {
                        return;
                    }
                    throw error;
                });
            promises.push(promise);
        }
        await Promise.all(promises);
        return new GraphView(this, graphSpec);
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

    getModule(url: string) {
        return this.modules.get(url) ?? null;
    }

    defineModule(url: string, def: ModuleDefinition | ModuleSpec): ModuleSpec {
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
        this.modules.set(url, spec);
        return spec;
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