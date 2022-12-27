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
    mainScope: CompilerScope;
    subgraphScopes: CompilerScope[];

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
        moduleSpec.params = this.computeParamSpecs();
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
        const moduleIds = new Set(allRefs);
        for (const moduleId of moduleIds) {
            if (moduleId.startsWith('@system/')) {
                continue;
            }
            const module = loader.resolveModule(moduleId);
            const computeUrl = module.attributes?.customImportUrl ??
                loader.resolveComputeUrl(moduleId);
            const sym = this.symbols.createDefSym(moduleId);
            this.code.line(`import { compute as ${sym} } from '${computeUrl}'`);
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
        this.emitComment('Exports');
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

    /**
     * Computes `moduleSpec.params` by sorting the parameters in the order they appear in the graph,
     * top-to-bottom, left-to-right.
     */
    private computeParamSpecs() {
        const paramEntries = Object.entries(this.graphView.moduleSpec.params);
        const paramNodes = this.graphView.getNodesByRef('@system/Param');
        paramNodes.sort((a, b) => {
            const ax = a.metadata.pos?.x ?? 0;
            const ay = a.metadata.pos?.y ?? 0;
            const bx = b.metadata.pos?.x ?? 0;
            const by = b.metadata.pos?.y ?? 0;
            return ay === by ? ax - bx : ay - by;
        });
        const sortedKeys = paramNodes.map(_ => _.getProp('key')?.value);
        paramEntries.sort((a, b) => {
            return sortedKeys.indexOf(a[0]) - sortedKeys.indexOf(b[0]);
        });
        return Object.fromEntries(paramEntries);
    }

    private *collectSubgraphScopes(): Iterable<CompilerScope> {
        for (const node of this.mainScope.getEmittedNodes()) {
            if (node.ref !== '@system/Subgraph') {
                continue;
            }
            const { subgraphId } = node.metadata.subgraphId;
            const subgraph = this.graphView.getSubgraphById(subgraphId);
            if (subgraph) {
                yield new CompilerScope(subgraphId, this.code, subgraph, this.symbols, this.options);
            }
        }
    }

}
