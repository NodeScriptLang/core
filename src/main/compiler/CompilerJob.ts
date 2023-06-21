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
    done = false;
    symbols = new CompilerSymbols();
    code = new CodeBuilder();

    scopeMap = new Map<string, CompilerScope>();
    mainScope: CompilerScope;

    constructor(
        readonly graphView: GraphView,
        readonly options: CompilerOptions,
    ) {
        this.mainScope = new CompilerScope(this, this.graphView);
        const subgraphScopes = [...this.graphView.collectSubgraphs()]
            .map(subgraph => {
                return new CompilerScope(this, subgraph);
            });
        for (const scope of [this.mainScope, ...subgraphScopes]) {
            this.scopeMap.set(scope.scopeId, scope);
        }
    }

    run() {
        if (this.done) {
            return;
        }
        this.prepareNodeSymbols();
        this.emitImports();
        this.emitNodeFunctions();
        this.emitExportCompute();
        if (this.options.emitNodeMap) {
            this.emitNodeMap();
        }
        this.done = true;
    }

    allScopes() {
        return this.scopeMap.values();
    }

    getModuleSpec(): ModuleSpec {
        const moduleSpec = clone(this.graphView.moduleSpec);
        moduleSpec.evalMode = this.mainScope.graph.getEvalMode();
        moduleSpec.result.async = this.mainScope.isAsync();
        moduleSpec.newScope = true;
        return moduleSpec;
    }

    getEmittedCode() {
        return this.code.toString();
    }

    private prepareNodeSymbols() {
        for (const scope of this.allScopes()) {
            for (const node of scope.getEmittedNodes()) {
                this.symbols.createNodeSym(node.nodeUid);
            }
        }
    }

    private emitImports() {
        this.emitComment('Imports');
        const loader = this.graphView.loader;
        const uniqueRefs = new Set([...this.collectEmittedRefs()]);
        for (const moduleRef of uniqueRefs) {
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
                const sym = this.symbols.getNodeSym(node.nodeUid);
                this.code.line(`nodeMap.set(${JSON.stringify(node.nodeUid)}, ${sym})`);
            }
        }
    }

    private *collectEmittedRefs() {
        for (const scope of this.allScopes()) {
            for (const node of scope.getEmittedNodes()) {
                yield node.ref;
            }
        }
    }

    private emitExportCompute() {
        const rootNode = this.graphView.getRootNode();
        if (!rootNode) {
            this.code.line(`export const compute = () => undefined;`);
        } else {
            const rootNodeSym = this.symbols.getNodeSym(rootNode.nodeUid);
            this.code.line(`export const compute = ${rootNodeSym};`);
        }
    }

    private emitComment(str: string) {
        if (this.options.comments) {
            this.code.line(`// ${str}`);
        }
    }

}
