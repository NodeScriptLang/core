import { GraphView, NodeLink, NodeView, PropLineView, PropView } from '../runtime/index.js';
import { DataSchemaSpec } from '../types/index.js';
import { isSchemaCompatible, MultiMap } from '../util/index.js';
import { CodeBuilder } from './CodeBuilder.js';
import { CompilerSymbols } from './CompilerSymbols.js';
import { CompilerOptions } from './GraphCompiler.js';

export class CompilerScope {

    private emittedNodes: NodeView[] = [];
    private linkMap: MultiMap<string, NodeLink>;
    private async: boolean;
    private asyncSym: string;
    private awaitSym: string;

    constructor(
        readonly scopeId: string,
        readonly code: CodeBuilder,
        readonly graphView: GraphView,
        readonly symbols: CompilerSymbols,
        readonly options: CompilerOptions,
    ) {
        this.emittedNodes = this.computeEmittedNodes();
        this.linkMap = graphView.computeLinkMap();
        this.async = this.emittedNodes.some(_ => _.getModuleSpec().result.async);
        this.asyncSym = this.async ? 'async ' : '';
        this.awaitSym = this.async ? 'await ' : '';
    }

    getEmittedNodes() {
        return this.emittedNodes;
    }

    isAsync() {
        return this.async;
    }

    computeEvalMode() {
        for (const node of this.emittedNodes) {
            if (node.getEvalMode() === 'manual') {
                return 'manual';
            }
        }
        return 'auto';
    }

    emitNodeFunctions() {
        for (const node of this.emittedNodes) {
            this.emitNode(node);
        }
    }

    private computeEmittedNodes() {
        if (this.options.emitAll) {
            return this.graphView.getNodes();
        }
        const rootNode = this.graphView.getNodeById(this.options.rootNodeId);
        if (rootNode) {
            return this.graphView.orderNodes([...rootNode.leftNodes()]);
        }
        return [];
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

    private emitNodePreamble(_node: NodeView) { }

    private emitNodeBodyIntrospect(node: NodeView) {
        const resSym = '$r';
        this.code.line(`let ${resSym};`);
        if (this.options.introspect) {
            this.code.block('try {', '}', () => {
                if (this.options.evalMode === 'manual') {
                    this.code.line(`ctx.checkPendingNode(${JSON.stringify(node.nodeId)});`);
                }
                this.code.line(`ctx.nodeEvaluated.emit({` +
                    `nodeId: ${JSON.stringify(node.nodeId)},` +
                    `progress: 0` +
                    `});`);
                this.emitNodeBodyRaw(node, resSym);
                if (this.options.introspect) {
                    this.code.line(`ctx.nodeEvaluated.emit({` +
                        `nodeId: ${JSON.stringify(node.nodeId)},` +
                        `result: ${resSym}` +
                        `});`);
                }
                this.code.line(`return ${resSym};`);
            });
            this.code.block('catch (error) {', '}', () => {
                this.code.line(`ctx.nodeEvaluated.emit({` +
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
        if (node.isExpanded()) {
            this.emitExpandedNode(node, resSym);
        } else {
            this.emitRegularNode(node, resSym);
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
                this.code.line(`ctx.nodeEvaluated.emit({` +
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
            const propSym = this.symbols.createLineSym(this.scopeId, line.getLineId());
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
                expr = `ctx.toArray(${linkExpr})`;
            }
            this.code.line(`const ${propSym} = ${expr}`);
        }
        this.code.line(`const $l = Math.min(${expSyms.map(s => `${s}.length`).join(',')});`);
    }

    private emitNodeCompute(node: NodeView, resSym: string) {
        switch (node.ref) {
            case '@system/Param': return this.emitParamNode(node, resSym);
            case '@system/Result': return this.emitResultNode(node, resSym);
            case '@system/Comment':
            case '@system/Frame':
                return;
            case '@system/Subgraph': return this.emitSubgraph(node, resSym);
            case '@system/EvalSync': return this.emitEvalSync(node, resSym);
            case '@system/EvalAsync': return this.emitEvalAsync(node, resSym);
            case '@system/EvalJson': return this.emitEvalJson(node, resSym);
            default: return this.emitGenericCompute(node, resSym);
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

    private emitSubgraph(node: NodeView, resSym: string) {
        const { subgraphId } = node.metadata;
        const subgraph = subgraphId ? this.graphView.getSubgraphById(subgraphId) : null;
        if (!subgraph) {
            return;
        }
        const subgraphResultSym = this.symbols.getNodeSym(subgraphId, subgraph.rootNodeId, '');
        if (!subgraphResultSym) {
            return;
        }
        this.code.line(`ctx.nodeId = ${JSON.stringify(`${subgraphId}:${node.nodeId}`)};`);
        this.code.block(`${resSym} = ${this.awaitSym}${subgraphResultSym}({`, `}, ctx.newScope());`, () => {
            this.emitNodeProps(node);
        });
    }

    private emitEvalSync(node: NodeView, resSym: string) {
        const code = node.getProp('code')?.value ?? '';
        this.code.block(`const $p = {`, `}`, () => {
            const prop = node.getProp('args');
            if (prop) {
                this.emitProp(prop);
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
                this.emitProp(prop);
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

    private emitGenericCompute(node: NodeView, resSym: string) {
        const defSym = this.symbols.getDefSym(node.ref);
        this.code.line(`ctx.nodeId = ${JSON.stringify(node.nodeId)};`);
        this.code.block(`${resSym} = ${this.awaitSym}${defSym}({`, `}, ctx.newScope());`, () => {
            this.emitNodeProps(node);
        });
    }

    private emitNodeProps(node: NodeView) {
        for (const prop of node.getProps()) {
            this.emitProp(prop);
        }
    }

    private emitProp(prop: PropView) {
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
            return this.deferredLineExpr(line, targetSchema);
        }
        const linkNode = line.getLinkNode();
        if (linkNode) {
            return this.linkLineExpr(line, linkNode, targetSchema);
        }
        return this.constantLineExpr(line, targetSchema);
    }

    /**
     * Returns line expression when the line is linked.
     */
    private linkLineExpr(line: PropLineView, linkNode: NodeView, targetSchema: DataSchemaSpec) {
        let expr = '';
        const sourceSchema: DataSchemaSpec = linkNode.getModuleSpec().result.schema;
        const expSym = this.symbols.getLineSymIfExists(this.scopeId, line.getLineId());
        if (expSym) {
            expr = `${expSym}[$i]`;
        } else {
            expr = this.nodeResultExpr(linkNode);
        }
        const needsTypeConversion = !isSchemaCompatible(targetSchema, sourceSchema);
        if (needsTypeConversion) {
            expr = this.convertTypeExpr(expr, targetSchema);
        }
        return expr;
    }

    /**
     * Returns line expression when the line is not linked.
     */
    private constantLineExpr(line: PropLineView, targetSchema: DataSchemaSpec) {
        const valueExpr = JSON.stringify(line.value);
        switch (targetSchema.type) {
            case 'any':
                return `ctx.convertAuto(${valueExpr})`;
            case 'string':
                return valueExpr;
            default:
                return this.convertTypeExpr(valueExpr, targetSchema);
        }
    }

    private deferredLineExpr(line: PropLineView, targetSchema: DataSchemaSpec) {
        const linkNode = line.getLinkNode()!;
        const sourceSchema = linkNode.getModuleSpec().result.schema;
        const linkSym = this.getNodeSym(linkNode.nodeId);
        const schemaCompatible = isSchemaCompatible(sourceSchema, targetSchema);
        return `ctx.deferred(() => ${linkSym}(params, ctx), ${schemaCompatible ? 'undefined' : JSON.stringify(targetSchema)})`;
    }

    private convertTypeExpr(expr: string, targetSchema: DataSchemaSpec) {
        return `ctx.convertType(${expr}, ${JSON.stringify(targetSchema)})`;
    }

    private nodeResultExpr(node: NodeView) {
        const sym = this.getNodeSym(node.nodeId);
        return `${this.awaitSym}${sym}(params, ctx)`;
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
                if (node.getEvalMode() === 'manual') {
                    return true;
                }
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

    private getNodeSym(nodeId: string) {
        return this.symbols.getNodeSym(this.scopeId, nodeId);
    }


}
