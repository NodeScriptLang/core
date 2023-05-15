import { GraphView, NodeLink, NodeView, PropLineView, PropView } from '../runtime/index.js';
import { SchemaSpec } from '../types/schema.js';
import { convertAuto, isSchemaCompatible, MultiMap } from '../util/index.js';
import { CodeBuilder } from './CodeBuilder.js';
import { CompilerError } from './CompilerError.js';
import { CompilerSymbols } from './CompilerSymbols.js';
import { CompilerOptions } from './GraphCompiler.js';

export class CompilerScope {

    private emittedNodes: NodeView[] = [];
    private linkMap: MultiMap<string, NodeLink>;
    private async: boolean;
    private lineExprMap = new Map<string, string>();

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
        this.code.block(`${this.asyncSym(node)}function ${sym}(params, ctx) {`, `}`, () => {
            if (this.isNodeCached(node)) {
                this.code.line(`let $c = ctx.cache.get("${node.nodeId}");`);
                this.code.line(`if ($c) { return $c.res; }`);
                this.code.block(`$c = (${this.asyncSym(node)}() => {`, `})();`, () => {
                    this.emitNodeBodyIntrospect(node);
                });
                this.code.line(`ctx.cache.set("${node.nodeId}", { res: $c });`);
                this.code.line(`return $c;`);
            } else {
                this.emitNodeBodyIntrospect(node);
            }
        });
    }

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
                        `result: ${resSym},` +
                        `timestamp: Date.now(),` +
                        `});`);
                }
                this.code.line(`return ${resSym};`);
            });
            this.code.block('catch (error) {', '}', () => {
                this.code.line(`ctx.nodeEvaluated.emit({` +
                    `nodeId: ${JSON.stringify(node.nodeId)},` +
                    `error,` +
                    `timestamp: Date.now(),` +
                    `});`);
                this.code.line('throw error;');
            });
        } else {
            this.emitNodeBodyRaw(node, resSym);
            this.code.line(`return ${resSym};`);
        }
    }

    private emitNodeBodyRaw(node: NodeView, resSym: string) {
        this.emitNodePreamble(node);
        if (node.isExpanded()) {
            this.emitExpandedNode(node, resSym);
        } else {
            this.emitRegularNode(node, resSym);
        }
    }

    private emitRegularNode(node: NodeView, resSym: string) {
        this.emitNodeCompute(node, resSym);
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
    }

    private emitNodePreamble(node: NodeView) {
        const syms: string[] = [];
        for (const line of node.allLines()) {
            const lineId = line.getLineId();
            const sym = this.symbols.createLineSym(this.scopeId, lineId);
            const { decl, expr } = this.createLineDecl(line, sym);
            if (decl) {
                this.code.line(`const ${sym} = ${decl}`);
                syms.push(sym);
            }
            this.lineExprMap.set(lineId, expr);
        }
        if (node.isAsync()) {
            // Note: leaving dangled promises makes JS report "Uncaught (in promise)",
            // despite the fact they are `await`ed further down the line.
            this.code.line(`await Promise.all([${syms.join(',')}]);`);
        }
    }

    private createLineDecl(line: PropLineView, sym: string): { decl?: string; expr: string } {
        const targetSchema = line.getSchema();
        const linkNode = line.getLinkNode();
        const linkKey = line.linkKey;
        // Linked
        if (linkNode) {
            const async = linkNode.isAsync();
            // 1. figure if type conversion is necessary
            let sourceSchema = linkNode.getModuleSpec().result.schema;
            if (linkKey) {
                sourceSchema = { type: 'any' };
            }
            // 2. create a base expression for calling the linked function, i.e. r1(params, ctx)
            const linkSym = this.getNodeSym(linkNode.nodeId);
            let callExpr = `${linkSym}(params, ctx)`;
            // 3. compose in linkKey operation
            if (linkKey) {
                callExpr = this.code.compose(async, callExpr, _ => {
                    return `ctx.lib.get(${_}, ${JSON.stringify(linkKey)})`;
                });
            }
            if (line.isDeferred()) {
                // Deferred:
                return {
                    decl: `ctx.deferred(() => ${this.convertTypeExpr(async, callExpr, sourceSchema, targetSchema)})`,
                    expr: sym,
                };
            } else if (line.isExpanded()) {
                // Expanded:
                // the linked call is awaited, then wrapped into ctx.toArray;
                // type conversion happens inside the loop, synchronously
                const expr = `${sym}[$i]`;
                return {
                    decl: `ctx.toArray(${this.awaitSym(linkNode)}${callExpr})`,
                    expr: this.convertTypeExpr(false, expr, sourceSchema, targetSchema),
                };
            }
            // Regular linked
            return {
                decl: this.convertTypeExpr(async, callExpr, sourceSchema, targetSchema),
                expr: `${this.awaitSym(linkNode)}${sym}`,
            };
        }
        // Static value
        const value = convertAuto(line.getStaticValue(), targetSchema);
        return {
            expr: this.escapeValue(value),
        };
    }

    private emitExpandedPreamble(node: NodeView) {
        const expSyms: string[] = [];
        for (const line of node.expandedLines()) {
            const lineId = line.getLineId();
            const sym = this.getLineSym(lineId);
            expSyms.push(sym);
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
        let expr = this.getLineExpr(prop);
        const targetSchema = this.graphView.moduleSpec.result.schema;
        expr = this.code.compose(node.isAsync(), expr, _ => `ctx.convertType(${_}, ${JSON.stringify(targetSchema)})`);
        this.code.line(`${resSym} = ${expr};`);
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
        const computeSym = this.symbols.getComputeSym(node.ref);
        this.code.line(`ctx.nodeId = ${JSON.stringify(node.nodeId)};`);
        this.code.block(`${resSym} = ${this.awaitSym(node)}${computeSym}({`, `}, ctx.newScope());`, () => {
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
                const expr = this.getLineExpr(p);
                this.code.line(`${expr},`);
            }
        });
    }

    private emitObjectEntries(prop: PropView) {
        this.code.block(`${JSON.stringify(prop.propKey)}: {`, '},', () => {
            for (const p of prop.getEntries()) {
                const expr = this.getLineExpr(p);
                this.code.line(`${JSON.stringify(p.key)}: ${expr},`);
            }
        });
    }

    private emitSingleProp(prop: PropView) {
        const expr = this.getLineExpr(prop);
        this.code.line(`${JSON.stringify(prop.propKey)}: ${expr},`);
    }

    private getLineExpr(line: PropLineView) {
        const lineId = line.getLineId();
        const expr = this.lineExprMap.get(lineId);
        if (!expr) {
            throw new CompilerError(`Line expression not found: ${lineId}`);
        }
        return expr;
    }

    private convertTypeExpr(async = false, expr: string, sourceSchema: SchemaSpec, targetSchema: SchemaSpec) {
        const schemaCompatible = isSchemaCompatible(targetSchema, sourceSchema);
        return schemaCompatible ? expr :
            this.code.compose(async, expr, _ => `ctx.convertType(${_}, ${JSON.stringify(targetSchema)})`);
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

    private getLineSym(lineId: string) {
        return this.symbols.getLineSym(this.scopeId, lineId);
    }

    private escapeValue(value: any) {
        if (value === undefined) {
            return 'undefined';
        }
        return JSON.stringify(value);
    }

    private asyncSym(node: NodeView) {
        return node.isAsync() ? 'async ' : '';
    }

    private awaitSym(node: NodeView) {
        return node.isAsync() ? `await ` : '';
    }

}
