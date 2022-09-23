import * as systemNodes from '../system/index.js';
import * as t from '../types/index.js';
import { GraphSpec, ModuleDefinition, ModuleSpec } from '../types/index.js';
import { Graph } from './Graph.js';

export interface GraphLoaderOptions {
    ignoreFailedDefs?: boolean;
}

export interface GraphLoader {
    resolveModule(url: string): ModuleSpec;
    loadModule(url: string): Promise<ModuleSpec>;
}

export class StandardGraphLoader implements GraphLoader {
    modules = new Map<string, ModuleSpec>();

    constructor() {
        this.defineModule('core:Comment', systemNodes.Comment);
        this.defineModule('core:Frame', systemNodes.Frame);
        this.defineModule('core:Local', systemNodes.Local);
        this.defineModule('core:Param', systemNodes.Param);
    }

    async loadGraph(
        spec: Partial<GraphSpec> = {},
        options: GraphLoaderOptions = {},
    ): Promise<Graph> {
        const { ignoreFailedDefs = false } = options;
        const { refs = {} } = spec;
        const promises = [];
        for (const url of Object.values(refs)) {
            if (!url) {
                continue;
            }
            const promise = this.loadModule(url)
                .catch(error => {
                    if (ignoreFailedDefs) {
                        return;
                    }
                    throw error;
                });
            promises.push(promise);
        }
        await Promise.all(promises);
        return new Graph(this, spec);
    }

    async loadModule(url: string): Promise<ModuleSpec> {
        const existing = this.getModule(url);
        if (existing) {
            // Do not import twice
            return existing;
        }
        if (url.startsWith('core:')) {
            // Do not import core:
            return existing ?? this.createUnresolved(url);
        }
        const def = this.getModule(url);
        return def ?? this.createUnresolved(url);
    }

    resolveModule(url: string): t.ModuleSpec {
        return this.getModule(url) ?? this.createUnresolved(url);
    }

    getModule(url: string) {
        return this.modules.get(url) ?? null;
    }

    defineModule(url: string, def: ModuleDefinition): ModuleSpec {
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

    protected createUnresolved(url: string): ModuleSpec {
        return {
            label: 'Unresolved',
            labelParam: '',
            keywords: [],
            description: `Module ${url} not found`,
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
    name = this.constructor.name;
    status = 500;
}
