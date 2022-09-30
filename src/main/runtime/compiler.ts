import { Graph, Node, NodeLink, Prop } from '../model/index.js';
import * as t from '../types/index.js';
import { NodeEvalMode } from '../types/index.js';
import { isSchemaCompatible, MultiMap } from '../util/index.js';
import { CodeBuilder } from './code.js';

export interface GraphCompilerOptions {
    rootNodeId: string;
    comments: boolean;
    introspect: boolean;
    emitNodeMap: boolean;
    emitAll: boolean;
    evalMode: NodeEvalMode;
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

    compileComputeEsm(graph: Graph, options: Partial<GraphCompilerOptions> = {}) {
        const gcc = new GraphCompilerContext(graph, options);
        return gcc.emitComputeEsm();
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
    order: Node[] = [];
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
        readonly graph: Graph,
        options: Partial<GraphCompilerOptions> = {},
    ) {
        this.options = {
            rootNodeId: this.graph.rootNodeId,
            comments: false,
            introspect: false,
            emitNodeMap: false,
            emitAll: false,
            evalMode: 'auto',
            ...options
        };
        this.order = this.computeOrder();
        this.linkMap = graph.computeLinkMap();
        this.async = this.order.some(_ => _.$module.result.async);
        this.asyncSym = this.async ? 'async ' : '';
        this.awaitSym = this.async ? 'await ' : '';
        this.prepareSymbols();
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

    get rootNode() {
        return this.graph.getNodeById(this.options.rootNodeId);
    }

    private computeOrder() {
        if (this.options.emitAll) {
            return this.graph.nodes;
        }
        if (this.rootNode) {
            return this.graph.computeOrder(this.rootNode.id);
        }
        return [];
    }

    private emitImports() {
        this.emitComment('Imports');
        const refs = new Set(this.order.map(_ => _.ref));
        for (const ref of refs) {
            const moduleUrl = this.graph.refs[ref];
            const module = this.graph.$loader.resolveModule(moduleUrl);
            const computeUrl = module.computeUrl;
            if (!computeUrl) {
                continue;
            }
            const sym = this.nextSym('n');
            this.symtable.set(`def:${ref}`, sym);
            this.code.line(`import { compute as ${sym} } from '${computeUrl}'`);
        }
    }

    private emitNodeFunctions() {
        for (const node of this.order) {
            this.emitNode(node);
        }
    }

    private emitNodeMap() {
        this.emitComment('Node Map');
        this.code.line('export const nodeMap = new Map()');
        for (const node of this.order) {
            const sym = this.getNodeSym(node.id);
            this.code.line(`nodeMap.set(${JSON.stringify(node.id)}, ${sym})`);
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

    private emitNode(node: Node) {
        this.emitComment(`${node.ref} ${node.id}`);
        const sym = this.getNodeSym(node.id);
        this.code.block(`${this.asyncSym}function ${sym}(params, ctx) {`, `}`, () => {
            this.emitNodePreamble(node);
            if (this.isNodeCached(node)) {
                this.code.line(`const $c = ctx.cache.get("${node.id}");`);
                this.code.line('if ($c) { if ($c.error) { throw $c.error } return $c.result }');
                this.code.block('try {', '}', () => {
                    this.emitNodeBodyIntrospect(node);
                });
                this.code.block('catch (error) {', '}', () => {
                    this.code.line(`ctx.cache.set("${node.id}", { error });`);
                    this.code.line(`throw error;`);
                });
            } else {
                this.emitNodeBodyIntrospect(node);
            }
        });
    }

    private emitNodePreamble(_node: Node) {
        this.code.line(`const {` +
            `convertType:${this.sym.convertType},` +
            `toArray:${this.sym.toArray},` +
            `nodeEvaluated:${this.sym.nodeEvaluated},` +
        `} = ctx;`);
    }

    private emitNodeBodyIntrospect(node: Node) {
        const resSym = '$r';
        this.code.line(`let ${resSym};`);
        if (this.options.introspect) {
            this.code.block('try {', '}', () => {
                if (this.options.evalMode === 'manual') {
                    this.code.line(`ctx.checkPendingNode(${JSON.stringify(node.id)});`);
                }
                this.code.line(`${this.sym.nodeEvaluated}.emit({` +
                    `nodeId: ${JSON.stringify(node.id)},` +
                    `progress: 0` +
                `});`);
                this.emitNodeBodyRaw(node, resSym);
                if (this.options.introspect) {
                    this.code.line(`${this.sym.nodeEvaluated}.emit({` +
                        `nodeId: ${JSON.stringify(node.id)},` +
                        `result: ${resSym}` +
                    `});`);
                }
                this.code.line(`return ${resSym};`);
            });
            this.code.block('catch (error) {', '}', () => {
                this.code.line(`${this.sym.nodeEvaluated}.emit({` +
                    `nodeId: ${JSON.stringify(node.id)},` +
                    `error` +
                `});`);
                this.code.line('throw error;');
            });
        } else {
            this.emitNodeBodyRaw(node, resSym);
            this.code.line(`return ${resSym};`);
        }
    }

    private emitNodeBodyRaw(node: Node, resSym: string) {
        switch (node.$moduleUrl) {
            case 'core:Param': return this.emitParamNode(node, resSym);
            case 'core:Local': return this.emitLocalNode(node, resSym);
            case 'core:EvalSync': return this.emitEvalSync(node, resSym);
            case 'core:EvalAsync': return this.emitEvalAsync(node, resSym);
            case 'core:EvalJson': return this.emitEvalJson(node, resSym);
            default:
                if (!node.$module.computeUrl) {
                    // TODO emit undefined
                    return;
                }
                if (node.isExpanded()) {
                    this.emitExpandedNode(node, resSym);
                } else {
                    this.emitRegularNode(node, resSym);
                }
        }
    }

    private emitParamNode(node: Node, resSym: string) {
        const prop = node.getBasePropByKey('key');
        const key = prop?.value;
        if (key) {
            this.code.line(`${resSym} = params[${JSON.stringify(key)}]`);
        } else {
            this.code.line(`${resSym} = undefined;`);
        }
    }

    private emitLocalNode(node: Node, resSym: string) {
        const prop = node.getBasePropByKey('key')!;
        this.code.line(`${resSym} = ctx.getLocal(${JSON.stringify(prop.value)});`);
    }

    private emitEvalSync(node: Node, resSym: string) {
        const code = node.props.find(_ => _.key === 'code')?.value ?? '';
        this.code.block(`const $p = {`, `}`, () => {
            const prop = node.getBasePropByKey('args');
            if (prop) {
                this.emitNodeProp(node, prop);
            }
        });
        const args = node.props.find(_ => _.key === 'args')?.entries ?? [];
        const argList = args.map(_ => _.key).join(',');
        const argVals = args.map(_ => `$p.args[${JSON.stringify(_.key)}]`).join(',');
        this.code.block(`${resSym} = ((${argList}) => {`, `})(${argVals})`, () => {
            this.code.line(code);
        });
    }

    private emitEvalAsync(node: Node, resSym: string) {
        const code = node.props.find(_ => _.key === 'code')?.value ?? '';
        this.code.block(`const $p = {`, `}`, () => {
            const prop = node.getBasePropByKey('args');
            if (prop) {
                this.emitNodeProp(node, prop);
            }
        });
        const args = node.props.find(_ => _.key === 'args')?.entries ?? [];
        const argList = args.map(_ => _.key).join(',');
        const argVals = args.map(_ => `$p.args[${JSON.stringify(_.key)}]`).join(',');
        this.code.block(`${resSym} = await (async (${argList}) => {`, `})(${argVals})`, () => {
            this.code.line(code);
        });
    }

    private emitEvalJson(node: Node, resSym: string) {
        const code = node.props.find(_ => _.key === 'code')?.value ?? '';
        try {
            // Make sure it's actually a JSON
            JSON.parse(code);
            this.code.line(`${resSym} = ${code};`);
        } catch (error: any) {
            this.code.line(`throw new Error(${JSON.stringify(error.message)})`);
        }
    }

    private emitRegularNode(node: Node, resSym: string) {
        this.emitNodeCompute(node, resSym);
        if (this.isNodeCached(node)) {
            this.code.line(`ctx.cache.set("${node.id}", { result: ${resSym} });`);
        }
    }

    private emitExpandedNode(node: Node, resSym: string) {
        // Expanded nodes always produce an array by
        // repeating the computation per each value of expanded property
        const props = [...node.actualProps()];
        const expandProps = props.filter(_ => _.isExpanded());
        this.code.line(`${resSym} = []`);
        const expSyms: string[] = [];
        for (const prop of expandProps) {
            const propSym = this.nextSym('p');
            this.symtable.set(`prop:${prop.id}`, propSym);
            expSyms.push(propSym);
            const linkNode = prop.getLinkNode()!;
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
        this.code.line(`const $l = Math.min(${
            expSyms.map(s => `${s}.length`).join(',')
        });`);
        this.code.block(`for (let $i = 0; $i < $l; $i++) {`, `}`, () => {
            if (this.options.introspect) {
                this.code.line(`${this.sym.nodeEvaluated}.emit({` +
                    `nodeId: ${JSON.stringify(node.id)},` +
                    `progress: $i / $l` +
                `});`);
            }
            const tempSym = `$t`;
            this.code.line(`let ${tempSym};`);
            this.emitNodeCompute(node, tempSym);
            this.code.line(`${resSym}.push(${tempSym});`);
        });
        if (this.isNodeCached(node)) {
            this.code.line(`ctx.cache.set("${node.id}", { result: ${resSym} });`);
        }
    }

    private emitNodeCompute(node: Node, resSym: string) {
        const defSym = this.getDefSym(node.ref);
        this.code.block(`${resSym} = ${this.awaitSym}${defSym}({`, `}, ctx.newScope());`, () => {
            this.emitNodeProps(node);
        });
    }

    private emitNodeProps(node: Node) {
        for (const prop of node.props) {
            this.emitNodeProp(node, prop);
        }
    }

    private emitNodeProp(node: Node, prop: Prop) {
        if (prop.isUsesEntries()) {
            this.emitEntries(prop);
        } else {
            this.emitSingleProp(prop);
        }
    }

    private emitEntries(prop: Prop) {
        const { schema } = prop.$param;
        switch (schema.type) {
            case 'array':
                return this.emitArrayEntries(prop);
            case 'object':
                return this.emitObjectEntries(prop);
        }
    }

    private emitArrayEntries(prop: Prop) {
        this.code.block(`${JSON.stringify(prop.key)}: [`, '],', () => {
            for (const p of prop.entries) {
                const expr = this.singlePropExpr(p);
                this.code.line(`${expr},`);
            }
        });
    }

    private emitObjectEntries(prop: Prop) {
        this.code.block(`${JSON.stringify(prop.key)}: {`, '},', () => {
            for (const p of prop.entries) {
                const expr = this.singlePropExpr(p);
                this.code.line(`${JSON.stringify(p.key)}: ${expr},`);
            }
        });
    }

    private emitSingleProp(prop: Prop) {
        const expr = this.singlePropExpr(prop);
        this.code.line(`${JSON.stringify(prop.key)}: ${expr},`);
    }

    private singlePropExpr(prop: Prop, targetSchema: t.DataSchemaSpec = prop.getTargetSchema()) {
        if (prop.isLambda()) {
            return this.lambdaPropExpr(prop);
        }
        let expr = this.rawPropExpr(prop);
        let sourceSchema: t.DataSchemaSpec = { type: 'string' };
        const linkNode = prop.getLinkNode();
        if (linkNode) {
            sourceSchema = linkNode.$module.result.schema;
        }
        const needsTypeConversion = !isSchemaCompatible(targetSchema, sourceSchema);
        if (needsTypeConversion) {
            expr = this.convertTypeExpr(expr, targetSchema);
        }
        return expr;
    }

    private convertTypeExpr(expr: string, targetSchema: t.DataSchemaSpec) {
        return `${this.sym.convertType}(${expr}, ${JSON.stringify(targetSchema)})`;
    }

    private rawPropExpr(prop: Prop) {
        // Property result expression prior to type conversion
        const expSym = this.symtable.get(`prop:${prop.id}`);
        if (expSym) {
            // Property was expanded
            return `${expSym}[$i]`;
        }
        // The rest only applies to non-expanded properties
        let expr = JSON.stringify(String(prop.value));
        const linkNode = prop.getLinkNode();
        if (linkNode) {
            expr = this.nodeResultExpr(linkNode);
        }
        return expr;
    }

    private nodeResultExpr(node: Node) {
        const sym = this.getNodeSym(node.id);
        return `${this.awaitSym}${sym}(params, ctx)`;
    }

    private lambdaPropExpr(prop: Prop) {
        const param = prop.$param;
        const linkNode = prop.getLinkNode();
        if (!linkNode) {
            return `() => ${this.convertTypeExpr(prop.value, param.schema)}`;
        }
        const targetSchema = linkNode.$module.result.schema;
        const linkSym = this.getNodeSym(linkNode.id);
        const schemaCompatible = isSchemaCompatible(param.schema, targetSchema);
        return `${this.asyncSym}(p) => {
            const childCtx = ctx.newScope(p);
            const res = ${this.awaitSym}${linkSym}(params, childCtx);
            return ${schemaCompatible ? 'res' : this.convertTypeExpr(`res`, targetSchema)};
        }`;
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

    private isNodeCached(node: Node) {
        const cache = node.$module.cacheMode ?? 'auto';
        switch (cache) {
            case 'auto': {
                const links = this.linkMap.get(node.id);
                if (links.size > 1) {
                    return true;
                }
                return [...links].some(link => link.prop.expand);
            }
            case 'always':
                return true;
            case 'never':
                return false;
        }
    }

    private prepareSymbols() {
        for (const node of this.order) {
            const sym = this.nextSym('r');
            this.symtable.set(`node:${node.id}`, sym);
        }
    }
}

export class CompilerError extends Error {
    name = this.constructor.name;
    status = 500;
}
