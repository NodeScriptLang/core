import { DataSchemaSpec, NodeEvalMode } from '../types/index.js';
import { isSchemaCompatible, MultiMap } from '../util/index.js';
import { CodeBuilder } from './CodeBuilder.js';
import { GraphView } from './GraphView.js';
import { NodeLink, NodeView } from './NodeView.js';
import { PropLineView, PropView } from './PropView.js';

export interface GraphCompilerOptions {
    rootNodeId: string;
    comments: boolean;
    introspect: boolean;
    emitNodeMap: boolean;
    emitAll: boolean;
    evalMode: NodeEvalMode;
    cacheErrors: boolean;
}

export interface GraphCompilerResult {
    code: string;
    async: boolean;
}

/**
 * Compiles a graph into a ESM module containing `compute` function.
 *
 * A compiled graph can be computed as follows:
 *
 * ```
 * const { compute } = await import(code);
 * const ctx = new GraphEvalContext(...);
 * await compute(params, ctx);
 * ```
 */
export class GraphCompiler {

    compileComputeEsm(graphView: GraphView, options: Partial<GraphCompilerOptions> = {}): GraphCompilerResult {
        const gcc = new GraphCompilerContext(graphView, options);
        const code = gcc.emitComputeEsm();
        return {
            code,
            async: gcc.async,
        };
    }

}

class GraphCompilerContext {
    options: GraphCompilerOptions;
    // Counters tracked for each emitted symbol to ensure variable name uniqueness
    symCounters = new Map<string, number>();
    // Symtable maps allocated symbols to domain-specific strings (e.g. node:<nodeId> -> r1)
    symtable = new Map<string, string>();
    // Buffered code
    code = new CodeBuilder();
    // The order in which nodes need to be computed to fulfill the root node
    emittedNodes: NodeView[] = [];
    // The cached dependency map of a graph
    linkMap: MultiMap<string, NodeLink>;
    // Whether the outcome is asynchronous or not
    async: boolean;
    // Async/await keywords
    asyncSym: string;
    awaitSym: string;

    // Commonly used symbols
    sym = {
        convertType: this.nextSym('o'),
        toArray: this.nextSym('o'),
        nodeEvaluated: this.nextSym('o'),
    };

    constructor(
        readonly graphView: GraphView,
        options: Partial<GraphCompilerOptions> = {},
    ) {
        this.options = {
            rootNodeId: this.graphView.rootNodeId,
            comments: false,
            introspect: false,
            emitNodeMap: false,
            emitAll: false,
            evalMode: 'auto',
            cacheErrors: false,
            ...options
        };
        this.emittedNodes = this.getEmittedNodes();
        this.linkMap = graphView.computeLinkMap();
        this.async = this.emittedNodes.some(_ => _.getModuleSpec().result.async);
        this.asyncSym = this.async ? 'async ' : '';
        this.awaitSym = this.async ? 'await ' : '';
        this.prepareSymbols();
    }

    get loader() {
        return this.graphView.loader;
    }

    get rootNode() {
        return this.graphView.getNodeById(this.options.rootNodeId);
    }

    emitComputeEsm() {
        this.emitImports();
        this.emitNodeFunctions();
        this.emitExportCompute();
        if (this.options.emitNodeMap) {
            this.emitNodeMap();
        }
        return this.code.toString();
    }

    private getEmittedNodes() {
        if (this.options.emitAll) {
            return this.graphView.getNodes();
        }
        if (this.rootNode) {
            return this.graphView.orderNodes([...this.rootNode.leftNodes()]);
        }
        return [];
    }

    private emitImports() {
        this.emitComment('Imports');
        const moduleIds = new Set(this.emittedNodes.map(_ => _.ref));
        for (const moduleId of moduleIds) {
            if (moduleId.startsWith('@system/')) {
                continue;
            }
            const module = this.loader.resolveModule(moduleId);
            const computeUrl = module.attributes?.customImportUrl ??
                this.loader.resolveComputeUrl(moduleId);
            const sym = this.nextSym('n');
            this.symtable.set(`def:${moduleId}`, sym);
            this.code.line(`import { compute as ${sym} } from '${computeUrl}'`);
        }
    }

    private emitNodeFunctions() {
        for (const node of this.emittedNodes) {
            this.emitNode(node);
        }
    }

    private emitNodeMap() {
        this.emitComment('Node Map');
        this.code.line('export const nodeMap = new Map()');
        for (const node of this.emittedNodes) {
            const sym = this.getNodeSym(node.nodeId);
            this.code.line(`nodeMap.set(${JSON.stringify(node.nodeId)}, ${sym})`);
        }
    }

    private emitExportCompute() {
        this.emitComment('Compute');
        this.code.block(`export ${this.asyncSym}function compute(params, ctx) {`, '}', () => {
            this.emitResult();
        });
    }

    private emitResult() {
        this.emitComment('Result');
        if (this.rootNode) {
            const expr = this.nodeResultExpr(this.rootNode);
            this.code.line(`return ${expr};`);
        } else {
            this.code.line(`return undefined;`);
        }
    }

    private emitNode(node: NodeView) {
        this.emitComment(`${node.ref} ${node.nodeId}`);
        const sym = this.getNodeSym(node.nodeId);
        this.code.block(`${this.asyncSym}function ${sym}(params, ctx) {`, `}`, () => {
            this.emitNodePreamble(node);
            if (this.isNodeCached(node)) {
                this.code.line(`const $c = ctx.cache.get("${node.nodeId}");`);
                this.code.line('if ($c) { if ($c.error) { throw $c.error } return $c.result }');
                if (this.options.cacheErrors) {
                    this.code.block('try {', '}', () => {
                        this.emitNodeBodyIntrospect(node);
                    });
                    this.code.block('catch (error) {', '}', () => {
                        this.code.line(`ctx.cache.set("${node.nodeId}", { error });`);
                        this.code.line(`throw error;`);
                    });
                } else {
                    this.emitNodeBodyIntrospect(node);
                }
            } else {
                this.emitNodeBodyIntrospect(node);
            }
        });
    }

    private emitNodePreamble(_node: NodeView) {
        this.code.line(`const {` +
            `convertType:${this.sym.convertType},` +
            `toArray:${this.sym.toArray},` +
            (this.options.introspect ? `nodeEvaluated:${this.sym.nodeEvaluated},` : '') +
        `} = ctx;`);
    }

    private emitNodeBodyIntrospect(node: NodeView) {
        const resSym = '$r';
        this.code.line(`let ${resSym};`);
        if (this.options.introspect) {
            this.code.block('try {', '}', () => {
                if (this.options.evalMode === 'manual') {
                    this.code.line(`ctx.checkPendingNode(${JSON.stringify(node.nodeId)});`);
                }
                this.code.line(`${this.sym.nodeEvaluated}.emit({` +
                    `nodeId: ${JSON.stringify(node.nodeId)},` +
                    `progress: 0` +
                `});`);
                this.emitNodeBodyRaw(node, resSym);
                if (this.options.introspect) {
                    this.code.line(`${this.sym.nodeEvaluated}.emit({` +
                        `nodeId: ${JSON.stringify(node.nodeId)},` +
                        `result: ${resSym}` +
                    `});`);
                }
                this.code.line(`return ${resSym};`);
            });
            this.code.block('catch (error) {', '}', () => {
                this.code.line(`${this.sym.nodeEvaluated}.emit({` +
                    `nodeId: ${JSON.stringify(node.nodeId)},` +
                    `error` +
                `});`);
                this.code.line('throw error;');
            });
        } else {
            this.emitNodeBodyRaw(node, resSym);
            this.code.line(`return ${resSym};`);
        }
    }

    private emitNodeBodyRaw(node: NodeView, resSym: string) {
        switch (node.ref) {
            case '@system/Param': return this.emitParamNode(node, resSym);
            case '@system/Result': return this.emitResultNode(node, resSym);
            case '@system/EvalSync': return this.emitEvalSync(node, resSym);
            case '@system/EvalAsync': return this.emitEvalAsync(node, resSym);
            case '@system/EvalJson': return this.emitEvalJson(node, resSym);
            case '@system/Comment':
            case '@system/Frame':
                return;
            default:
                if (node.isExpanded()) {
                    this.emitExpandedNode(node, resSym);
                } else {
                    this.emitRegularNode(node, resSym);
                }
        }
    }

    private emitParamNode(node: NodeView, resSym: string) {
        const prop = node.getProp('key');
        const key = prop?.value;
        if (key) {
            this.code.line(`${resSym} = params[${JSON.stringify(key)}]`);
        } else {
            this.code.line(`${resSym} = undefined;`);
        }
    }

    private emitResultNode(node: NodeView, resSym: string) {
        const prop = node.getProp('value')!;
        const expr = this.singleLineExpr(prop, this.graphView.moduleSpec.result.schema);
        this.code.line(`${resSym} = ${expr};`);
    }

    private emitEvalSync(node: NodeView, resSym: string) {
        const code = node.getProp('code')?.value ?? '';
        this.code.block(`const $p = {`, `}`, () => {
            const prop = node.getProp('args');
            if (prop) {
                this.emitNodeProp(node, prop);
            }
        });
        const args = node.getProp('args')?.getEntries() ?? [];
        const argList = args.map(_ => _.key).join(',');
        const argVals = args.map(_ => `$p.args[${JSON.stringify(_.key)}]`).join(',');
        this.code.block(`${resSym} = ((${argList}) => {`, `})(${argVals})`, () => {
            this.code.line(code);
        });
    }

    private emitEvalAsync(node: NodeView, resSym: string) {
        const code = node.getProp('code')?.value ?? '';
        this.code.block(`const $p = {`, `}`, () => {
            const prop = node.getProp('args');
            if (prop) {
                this.emitNodeProp(node, prop);
            }
        });
        const args = node.getProp('args')?.getEntries() ?? [];
        const argList = args.map(_ => _.key).join(',');
        const argVals = args.map(_ => `$p.args[${JSON.stringify(_.key)}]`).join(',');
        this.code.block(`${resSym} = await (async (${argList}) => {`, `})(${argVals})`, () => {
            this.code.line(code);
        });
    }

    private emitEvalJson(node: NodeView, resSym: string) {
        const code = node.getProp('code')?.value ?? '';
        try {
            // Make sure it's actually a JSON
            JSON.parse(code);
            this.code.line(`${resSym} = ${code};`);
        } catch (error: any) {
            this.code.line(`throw new Error(${JSON.stringify(error.message)})`);
        }
    }

    private emitRegularNode(node: NodeView, resSym: string) {
        this.emitNodeCompute(node, resSym);
        if (this.isNodeCached(node)) {
            this.code.line(`ctx.cache.set("${node.nodeId}", { result: ${resSym} });`);
        }
    }

    private emitExpandedNode(node: NodeView, resSym: string) {
        // Expanded nodes always produce an array by
        // repeating the computation per each value of expanded property
        this.emitExpandedPreamble(node);
        this.code.line(`${resSym} = []`);
        this.code.block(`for (let $i = 0; $i < $l; $i++) {`, `}`, () => {
            if (this.options.introspect) {
                this.code.line(`${this.sym.nodeEvaluated}.emit({` +
                    `nodeId: ${JSON.stringify(node.nodeId)},` +
                    `progress: $i / $l` +
                `});`);
            }
            const tempSym = `$t`;
            this.code.line(`let ${tempSym};`);
            this.emitNodeCompute(node, tempSym);
            this.code.line(`${resSym}.push(${tempSym});`);
        });
        if (this.isNodeCached(node)) {
            this.code.line(`ctx.cache.set("${node.nodeId}", { result: ${resSym} });`);
        }
    }

    private emitExpandedPreamble(node: NodeView) {
        const expSyms: string[] = [];
        for (const line of node.expandedLines()) {
            const propSym = this.nextSym('p');
            this.symtable.set(`prop:${line.getLineId()}`, propSym);
            expSyms.push(propSym);
            const linkNode = line.getLinkNode()!;
            const linkExpr = this.nodeResultExpr(linkNode);
            const linkExpanded = linkNode.isExpanded();
            // Each expanded property needs to be awaited and converted into an array
            let expr;
            if (linkExpanded) {
                // The linked result is already an array, no need to convert
                expr = `${linkExpr}`;
            } else {
                expr = `${this.sym.toArray}(${linkExpr})`;
            }
            this.code.line(`const ${propSym} = ${expr}`);
        }
        this.code.line(`const $l = Math.min(${expSyms.map(s => `${s}.length`).join(',')});`);
    }

    private emitNodeCompute(node: NodeView, resSym: string) {
        const defSym = this.getDefSym(node.ref);
        this.code.block(`${resSym} = ${this.awaitSym}${defSym}({`, `}, ctx.newScope());`, () => {
            this.emitNodeProps(node);
        });
    }

    private emitNodeProps(node: NodeView) {
        for (const prop of node.getProps()) {
            this.emitNodeProp(node, prop);
        }
    }

    private emitNodeProp(node: NodeView, prop: PropView) {
        if (prop.isUsesEntries()) {
            this.emitEntries(prop);
        } else {
            this.emitSingleProp(prop);
        }
    }

    private emitEntries(prop: PropView) {
        const { schema } = prop.getParamSpec();
        switch (schema.type) {
            case 'array':
                return this.emitArrayEntries(prop);
            case 'object':
                return this.emitObjectEntries(prop);
        }
    }

    private emitArrayEntries(prop: PropView) {
        this.code.block(`${JSON.stringify(prop.propKey)}: [`, '],', () => {
            for (const p of prop.getEntries()) {
                const expr = this.singleLineExpr(p);
                this.code.line(`${expr},`);
            }
        });
    }

    private emitObjectEntries(prop: PropView) {
        this.code.block(`${JSON.stringify(prop.propKey)}: {`, '},', () => {
            for (const p of prop.getEntries()) {
                const expr = this.singleLineExpr(p);
                this.code.line(`${JSON.stringify(p.key)}: ${expr},`);
            }
        });
    }

    private emitSingleProp(prop: PropView) {
        const expr = this.singleLineExpr(prop);
        this.code.line(`${JSON.stringify(prop.propKey)}: ${expr},`);
    }

    private singleLineExpr(line: PropLineView, targetSchema: DataSchemaSpec = line.getSchema()) {
        if (line.isDeferred()) {
            return this.deferredLineExpr(line);
        }
        let expr = this.rawLineExpr(line);
        let sourceSchema: DataSchemaSpec = { type: 'string' };
        const linkNode = line.getLinkNode();
        if (linkNode) {
            sourceSchema = linkNode.getModuleSpec().result.schema;
        }
        const needsTypeConversion = !isSchemaCompatible(targetSchema, sourceSchema);
        if (needsTypeConversion) {
            expr = this.convertTypeExpr(expr, targetSchema);
        }
        return expr;
    }

    // Property result expression prior to type conversion
    private rawLineExpr(line: PropLineView) {
        // Expanded properties are added to symtable
        const expSym = this.symtable.get(`prop:${line.getLineId()}`);
        if (expSym) {
            return `${expSym}[$i]`;
        }
        // The rest only applies to non-expanded properties
        let expr = JSON.stringify(String(line.value));
        const linkNode = line.getLinkNode();
        if (linkNode) {
            expr = this.nodeResultExpr(linkNode);
        }
        return expr;
    }

    private deferredLineExpr(line: PropLineView) {
        const paramSpec = line.getParamSpec();
        const linkNode = line.getLinkNode()!;
        const targetSchema = linkNode.getModuleSpec().result.schema;
        const linkSym = this.getNodeSym(linkNode.nodeId);
        const schemaCompatible = isSchemaCompatible(paramSpec.schema, targetSchema);
        return `ctx.deferred(() => ${linkSym}(params, ctx), ${schemaCompatible ? 'undefined' : JSON.stringify(targetSchema)})`;
    }

    private convertTypeExpr(expr: string, targetSchema: DataSchemaSpec) {
        return `${this.sym.convertType}(${expr}, ${JSON.stringify(targetSchema)})`;
    }

    private nodeResultExpr(node: NodeView) {
        const sym = this.getNodeSym(node.nodeId);
        return `${this.awaitSym}${sym}(params, ctx)`;
    }

    private getNodeSym(nodeId: string) {
        return this.getSym(`node:${nodeId}`);
    }

    private getDefSym(ref: string) {
        return this.getSym(`def:${ref}`);
    }

    private getSym(id: string) {
        const sym = this.symtable.get(id);
        if (!sym) {
            throw new CompilerError(`Symbol not found: ${id}`);
        }
        return sym;
    }

    private nextSym(sym: string) {
        const c = this.symCounters.get(sym) ?? 0;
        this.symCounters.set(sym, c + 1);
        return `${sym}${c + 1}`;
    }

    private emitComment(str: string) {
        if (this.options.comments) {
            this.code.line(`// ${str}`);
        }
    }

    private isNodeCached(node: NodeView) {
        const cache = node.getModuleSpec().cacheMode ?? 'auto';
        switch (cache) {
            case 'auto': {
                const links = this.linkMap.get(node.nodeId);
                if (links.size > 1) {
                    return true;
                }
                return [...links].some(link => link.prop.isExpanded());
            }
            case 'always':
                return true;
            case 'never':
                return false;
        }
    }

    private prepareSymbols() {
        for (const node of this.emittedNodes) {
            const sym = this.nextSym('r');
            this.symtable.set(`node:${node.nodeId}`, sym);
        }
    }
}

export class CompilerError extends Error {
    override name = this.constructor.name;
    status = 500;
}
