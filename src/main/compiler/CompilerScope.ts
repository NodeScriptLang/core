import { GraphView, NodeLink, NodeView, PropLineView, PropView } from '../runtime/index.js';
import { SchemaSpec } from '../types/schema.js';
import { convertAuto, isSchemaCompatible, MultiMap } from '../util/index.js';
import { CompilerError } from './CompilerError.js';
import { CompilerJob } from './CompilerJob.js';

export class CompilerScope {

    private emittedNodes: NodeView[] = [];
    private linkMap: MultiMap<string, NodeLink>;
    private async: boolean;
    private lineExprMap = new Map<string, string>();

    constructor(
        readonly job: CompilerJob,
        readonly graph: GraphView,
    ) {
        this.emittedNodes = this.computeEmittedNodes();
        this.linkMap = graph.computeLinkMap();
        this.async = this.emittedNodes.some(_ => _.getModuleSpec().result.async);
    }

    get scopeId() {
        return this.graph.scopeId;
    }

    get code() {
        return this.job.code;
    }

    get symbols() {
        return this.job.symbols;
    }

    get options() {
        return this.job.options;
    }

    getEmittedNodes() {
        return this.emittedNodes;
    }

    isAsync() {
        return this.async;
    }

    emitNodeFunctions() {
        for (const node of this.emittedNodes) {
            this.emitNode(node);
        }
    }

    private computeEmittedNodes() {
        if (this.options.emitAll) {
            return this.graph.getNodes();
        }
        return this.graph.getEmittedNodes();
    }

    private emitNode(node: NodeView) {
        this.emitComment(`${node.ref} ${node.nodeUid}`);
        const sym = this.symbols.getNodeSym(node.nodeUid);
        this.code.block(`${this.asyncSym(node)}function ${sym}(params, ctx) {`, `}`, () => {
            if (this.isNodeCached(node)) {
                this.code.line(`let $c = ctx.cache.get("${node.nodeUid}");`);
                this.code.line(`if ($c) { return $c.res; }`);
                this.code.block(`$c = (${this.asyncSym(node)}() => {`, `})();`, () => {
                    this.emitNodeBodyIntrospect(node);
                });
                this.code.line(`ctx.cache.set("${node.nodeUid}", { res: $c });`);
                this.code.line(`return $c;`);
            } else {
                this.emitNodeBodyIntrospect(node);
            }
        });
    }

    private emitNodeBodyIntrospect(node: NodeView) {
        const resSym = '$r';
        this.code.line(`let ${resSym};`);
        this.code.line(`ctx.nodeUid = ${JSON.stringify(node.nodeUid)}`);
        if (this.options.introspect) {
            const nodeUid = node.nodeUid;
            this.code.block('try {', '}', () => {
                if (!node.supportsSubgraph()) {
                    // For subgraphs, pending check is done prior to calling the subgraph the first time.
                    this.code.line(`ctx.checkPendingNode(${JSON.stringify(nodeUid)});`);
                }
                this.code.line(`ctx.nodeEvaluated.emit({` +
                    `nodeUid: ${JSON.stringify(nodeUid)},` +
                    `progress: 0` +
                    `});`);
                this.emitNodeBodyRaw(node, resSym);
                if (this.options.introspect) {
                    this.code.line(`ctx.nodeEvaluated.emit({` +
                        `nodeUid: ${JSON.stringify(nodeUid)},` +
                        `result: ${resSym},` +
                        `});`);
                }
                this.code.line(`return ${resSym};`);
            });
            this.code.block('catch (error) {', '}', () => {
                this.code.line(`ctx.nodeEvaluated.emit({` +
                    `nodeUid: ${JSON.stringify(nodeUid)},` +
                    `error,` +
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
                    `nodeUid: ${JSON.stringify(node.nodeUid)},` +
                    `progress: $i / $l,` +
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
        for (const line of node.effectiveLines()) {
            const lineUid = line.lineUid;
            const sym = this.symbols.createLineSym(lineUid);
            const { decl, expr } = this.createLineDecl(line, sym);
            if (decl) {
                this.code.line(`const ${sym} = ${decl}`);
                syms.push(sym);
            }
            this.lineExprMap.set(lineUid, expr);
        }
        if (node.isAsync()) {
            // Note: leaving dangled promises makes JS report "Uncaught (in promise)",
            // despite the fact they are `await`ed further down the line.
            this.code.line(`await Promise.all([${syms.join(',')}]);`);
        }
    }

    private emitExpandedPreamble(node: NodeView) {
        const args: string[] = [];
        for (const line of node.expandedLines()) {
            const lineUid = line.lineUid;
            const sym = this.symbols.getLineSym(lineUid);
            args.push(`${sym}.length`);
        }
        this.code.line(`const $l = Math.min(${args.join(',')});`);
    }

    private createLineDecl(line: PropLineView, sym: string): { decl?: string; expr: string } {
        const targetSchema = line.getSchema();
        const linkNode = line.getLinkNode();
        const linkKey = line.linkKey;
        // Linked
        if (linkNode) {
            if (this.options.comments) {
                this.code.line(`// Line: ${line.lineUid}`);
                this.code.line(`// Schema: ${JSON.stringify(targetSchema)}`);
            }
            const async = linkNode.isAsync();
            // 1. figure if type conversion is necessary
            let sourceSchema = linkNode.getModuleSpec().result.schema;
            if (linkKey) {
                sourceSchema = { type: 'any' };
            }
            // 2. create a base expression for calling the linked function, i.e. r1(params, ctx)
            const linkSym = this.symbols.getNodeSym(linkNode.nodeUid);
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

    private emitNodeCompute(node: NodeView, resSym: string) {
        switch (node.ref) {
            case '@system/Param':
                return this.emitParamNode(node, resSym);
            case '@system/Input':
                return this.emitInputNode(node, resSym);
            case '@system/Scope':
                return this.emitScopeNode(node, resSym);
            case '@system/Result':
            case '@system/Output':
                return this.emitOutputNode(node, resSym);
            case '@system/Comment':
            case '@system/Frame':
                return;
            case '@system/AI':
                return this.emitAI(node, resSym);
            case '@system/EvalSync':
                return this.emitEvalSync(node, resSym);
            case '@system/EvalAsync':
                return this.emitEvalAsync(node, resSym);
            case '@system/EvalJson':
                return this.emitEvalJson(node, resSym);
            case '@system/EvalTemplate':
                return this.emitEvalTemplate(node, resSym);
            default:
                return this.emitGenericCompute(node, resSym);
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

    private emitInputNode(node: NodeView, resSym: string) {
        this.code.line(`${resSym} = { ...params, ...ctx.getScopeData() };`);
        // TODO phase out the workaround after subgraphs are migrated to Scope + Param nodes
        // this.code.line(`${resSym} = params;`);
    }

    private emitScopeNode(node: NodeView, resSym: string) {
        this.code.line(`${resSym} = ctx.getScopeData();`);
    }

    private emitOutputNode(node: NodeView, resSym: string) {
        this.code.block(`const $p = {`, `}`, () => {
            this.emitNodeProps(node);
        });
        this.code.line(`${resSym} = $p.value;`);
    }

    private emitEvalSync(node: NodeView, resSym: string) {
        this.emitEvalLike(node, resSym, false, 'code', 'args');
    }

    private emitEvalAsync(node: NodeView, resSym: string) {
        this.emitEvalLike(node, resSym, true, 'code', 'args');
    }

    private emitAI(node: NodeView, resSym: string) {
        const async = node.isAsync();
        this.emitEvalLike(node, resSym, async, 'code', 'inputs');
    }

    private emitEvalLike(
        node: NodeView,
        resSym: string,
        async: boolean,
        codeKey: string,
        argsKey: string,
    ) {
        const code = node.getProp(codeKey)?.value ?? '';
        this.code.block(`const $p = {`, `}`, () => {
            const prop = node.getProp(argsKey);
            if (prop) {
                this.emitProp(prop);
            }
        });
        const args = node.getProp(argsKey)?.getEntries().filter(_ => _.key.trim() !== '') ?? [];
        const argList = args.map(_ => _.key).join(',');
        const argVals = args.map(_ => `$p.${argsKey}[${JSON.stringify(_.key)}]`).join(',');
        if (async) {
            this.code.block(`${resSym} = await (async (${argList}) => {`, `})(${argVals})`, () => {
                this.code.line(code);
            });
        } else {
            this.code.block(`${resSym} = ((${argList}) => {`, `})(${argVals})`, () => {
                this.code.line(code);
            });
        }
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

    private emitEvalTemplate(node: NodeView, resSym: string) {
        const template = (node.getProp('template')?.value ?? '')
            .replace(/`/g, '\\`')
            .replace(/\\\\`/g, '\\\\\\`');
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
            this.code.line(`return \`${template}\``);
        });
    }

    private emitGenericCompute(node: NodeView, resSym: string) {
        const computeSym = this.symbols.getComputeSym(node.ref);
        const scopeSym = node.getModuleSpec().newScope ? `ctx.newScope()` : `ctx`;
        const subgraphSym = this.getSubgraphExpr(node);
        const argsExpr = [scopeSym, subgraphSym].filter(Boolean).join(',');
        this.code.block(`${resSym} = ${this.awaitSym(node)}${computeSym}({`, `}, ${argsExpr});`, () => {
            this.emitNodeProps(node);
        });
    }

    private getSubgraphExpr(node: NodeView) {
        const subgraph = node.getSubgraph();
        if (!subgraph) {
            return '';
        }
        const rootNode = subgraph.getRootNode();
        if (!rootNode) {
            return `() => undefined`;
        }
        const sym = this.symbols.getNodeSym(rootNode.nodeUid);
        if (this.options.introspect) {
            return [
                `(scopeData, ctx) => {`,
                `ctx.scopeCaptured.emit({ nodeUid: ${JSON.stringify(node.nodeUid)}, params: scopeData });`,
                `ctx.checkPendingNode(${JSON.stringify(node.nodeUid)});`,
                `return ${sym}(params, ctx.setScopeData(scopeData));`,
                `}`,
            ].join('');
        }
        return `(scopeData, ctx) => ${sym}(params, ctx.setScopeData(scopeData))`;
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
        const lineId = line.lineUid;
        const expr = this.lineExprMap.get(lineId);
        if (!expr) {
            throw new CompilerError(`Line expression not found: ${lineId}`);
        }
        return expr;
    }

    private convertTypeExpr(async = false, expr: string, sourceSchema: SchemaSpec, targetSchema: SchemaSpec) {
        const schemaCompatible = isSchemaCompatible(targetSchema, sourceSchema);
        return schemaCompatible ?
            expr :
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
                const links = this.linkMap.get(node.localId);
                if (links.size > 1) {
                    return true;
                }
                return node.isExpanded();
            }
            case 'always':
                return true;
            case 'never':
                return false;
        }
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
