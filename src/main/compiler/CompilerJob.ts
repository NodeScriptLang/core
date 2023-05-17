import { GraphView } from '../runtime/index.js';
import { ModuleSpec } from '../types/index.js';
import { clone } from '../util/index.js';
import { CodeBuilder } from './CodeBuilder.js';
import { CompilerScope } from './CompilerScope.js';
import { CompilerSymbols } from './CompilerSymbols.js';
import { CompilerOptions } from './GraphCompiler.js';

/**
 * Compiler's unit of work.
 */
export class CompilerJob {
    private done = false;
    private symbols = new CompilerSymbols();
    private code = new CodeBuilder();
    private mainScope: CompilerScope;
    private subgraphScopes: CompilerScope[];

    constructor(
        readonly graphView: GraphView,
        readonly options: CompilerOptions,
    ) {
        this.mainScope = new CompilerScope('root', this.code, this.graphView, this.symbols, this.options);
        this.subgraphScopes = [...this.collectSubgraphScopes()];
    }

    run() {
        if (this.done) {
            return;
        }
        this.prepareNodeSymbols();
        this.emitImports();
        this.emitNodeFunctions();
        // this.emitExportModule();
        this.emitExportCompute();
        if (this.options.emitNodeMap) {
            this.emitNodeMap();
        }
        this.done = true;
    }

    allScopes() {
        return [this.mainScope, ...this.subgraphScopes];
    }

    getModuleSpec(): ModuleSpec {
        const moduleSpec = clone(this.graphView.moduleSpec);
        moduleSpec.evalMode = this.mainScope.computeEvalMode();
        moduleSpec.result.async = this.mainScope.isAsync();
        return moduleSpec;
    }

    getEmittedCode() {
        return this.code.toString();
    }

    private prepareNodeSymbols() {
        for (const scope of this.allScopes()) {
            for (const node of scope.getEmittedNodes()) {
                this.symbols.createNodeSym(scope.scopeId, node.nodeId);
            }
        }
    }

    private emitImports() {
        this.emitComment('Imports');
        const loader = this.graphView.loader;
        const allRefs = this.allScopes()
            .flatMap(_ => _.getEmittedNodes())
            .map(_ => _.ref);
        const moduleRefs = new Set(allRefs);
        for (const moduleRef of moduleRefs) {
            if (moduleRef.startsWith('@system/')) {
                continue;
            }
            const module = loader.resolveModule(moduleRef);
            const computeUrl = module.attributes?.customImportUrl ??
                loader.resolveComputeUrl(moduleRef);
            const computeSym = this.symbols.createComputeSym(moduleRef);
            this.code.line(`import { compute as ${computeSym}} from '${computeUrl}'`);
        }
    }

    private emitNodeFunctions() {
        for (const scope of this.allScopes()) {
            scope.emitNodeFunctions();
        }
    }

    private emitNodeMap() {
        this.emitComment('Node Map');
        this.code.line('export const nodeMap = new Map()');
        for (const scope of this.allScopes()) {
            for (const node of scope.getEmittedNodes()) {
                const sym = this.symbols.getNodeSym(scope.scopeId, node.nodeId);
                this.code.line(`nodeMap.set(${JSON.stringify(node.nodeId)}, ${sym})`);
            }
        }
    }

    private emitExportCompute() {
        const rootNode = this.graphView.getNodeById(this.options.rootNodeId);
        if (!rootNode) {
            this.code.line(`export const compute = () => undefined;`);
        } else {
            const rootNodeSym = this.symbols.getNodeSym('root', rootNode.nodeId);
            this.code.line(`export const compute = ${rootNodeSym};`);
        }
    }

    private emitComment(str: string) {
        if (this.options.comments) {
            this.code.line(`// ${str}`);
        }
    }

    private *collectSubgraphScopes(): Iterable<CompilerScope> {
        for (const node of this.mainScope.getEmittedNodes()) {
            if (node.ref !== '@system/Subgraph') {
                continue;
            }
            const { subgraphId } = node.metadata;
            const subgraph = this.graphView.getSubgraphById(subgraphId);
            if (subgraph) {
                yield new CompilerScope(subgraphId, this.code, subgraph, this.symbols, {
                    ...this.options,
                    rootNodeId: subgraph.rootNodeId,
                });
            }
        }
    }

}
