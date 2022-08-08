import { Graph, Node, NodeLink, Prop } from '../model/index.js';
import * as t from '../types/index.js';
import { isSchemaCompatible, MultiMap } from '../util/index.js';
import { CodeBuilder } from './code.js';

export interface GraphCompilerOptions {
    rootNodeId: string;
    comments: boolean;
    introspect: boolean;
    emitNodeMap: boolean;
    emitAll: boolean;
}

/**
 * Compiles a graph into an EcmaScript Module (ESM).
 *
 * The result is a standard node definition module with `export node = { ... }`.
 * A compiled graph can be computed as follows:
 *
 * ```
 * const { node } = await import(code);
 * const ctx = new GraphEvalContext(...);
 * await node.compute(params, ctx);
 * ```
 */
export class GraphCompiler {

    compileEsm(graph: Graph, options: Partial<GraphCompilerOptions> = {}) {
        const node = graph.getNodeById(options.rootNodeId ?? graph.rootNodeId);
        if (!node) {
            throw new CompilerError('Root node not found');
        }
        const gcc = new GraphCompilerContext(graph, node, options);
        return gcc.compileEsm();
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
        readonly rootNode: Node,
        options: Partial<GraphCompilerOptions> = {},
    ) {
        this.options = {
            rootNodeId: rootNode.id,
            comments: false,
            introspect: false,
            emitNodeMap: false,
            emitAll: false,
            ...options
        };
        this.order = this.options.emitAll ? graph.nodes : graph.computeOrder(rootNode.id);
        this.linkMap = graph.computeLinkMap();
        this.async = this.order.some(_ => _.$def.metadata.async);
        this.asyncSym = this.async ? 'async ' : '';
        this.awaitSym = this.async ? 'await ' : '';
        this.prepareSymbols();
    }

    compileEsm() {
        this.emitImports();
        this.emitNodeFunctions();
        this.emitExportNode();
        if (this.options.emitNodeMap) {
            this.emitNodeMap();
        }
        return this.code.toString();
    }

    private emitImports() {
        this.emitComment('Imports');
        const refs = new Set(this.order.map(_ => _.ref));
        for (const ref of refs) {
            const uri = this.graph.refs[ref];
            if (!uri) {
                throw new CompilerError(`Cannot resolve ref ${ref}`);
            }
            if (uri.startsWith('core:')) {
                continue;
            }
            const sym = this.nextSym('n');
            this.symtable.set(`def:${ref}`, sym);
            this.code.line(`import { node as ${sym} } from '${uri}'`);
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

    private emitExportNode() {
        this.emitComment('Node Definition');
        this.code.block('export const node = {', '};', () => {
            this.emitGraphMetadata();
            this.code.block(`${this.asyncSym}compute(params, ctx) {`, '}', () => {
                this.emitResult();
            });
        });
    }

    private emitGraphMetadata() {
        this.code.line(`metadata: ${JSON.stringify(this.graph.metadata)},`);
    }

    private emitResult() {
        this.emitComment('Result');
        const expr = this.nodeResultExpr(this.rootNode);
        this.code.line(`return ${expr};`);
    }

    private emitNode(node: Node) {
        this.emitComment(`${node.ref} ${node.id}`);
        const sym = this.getNodeSym(node.id);
        this.code.block(`${this.asyncSym}function ${sym}(params, ctx) {`, `}`, () => {
            this.emitNodePreamble(node);
            if (this.isNodeCached(node)) {
                this.code.line(`const $c = ctx.$cache.get("${node.id}");`);
                this.code.line('if ($c) { if ($c.error) { throw $c.error } return $c.result }');
                this.code.block('try {', '}', () => {
                    this.emitNodeBody(node);
                });
                this.code.block('catch (error) {', '}', () => {
                    this.code.line(`ctx.$cache.set("${node.id}", { error });`);
                    this.code.line(`throw error;`);
                });
            } else {
                this.emitNodeBody(node);
            }
        });
    }

    private emitNodePreamble(node: Node) {
        this.code.line(`const {` +
            `$convertType:${this.sym.convertType},` +
            `$toArray:${this.sym.toArray},` +
            `$nodeEvaluated:${this.sym.nodeEvaluated},` +
        `} = ctx;`);
    }

    private emitNodeBody(node: Node) {
        const resSym = '$r';
        const emitBody = () => {
            switch (node.$uri) {
                case 'core:Param': return this.emitParamNode(node, resSym);
                case 'core:Local': return this.emitLocalNode(node, resSym);
                case 'core:Result': return this.emitResultNode(node, resSym);
                case 'core:Comment': return;
                default:
                    if (node.isExpanded()) {
                        this.emitExpandedNode(node, resSym);
                    } else {
                        this.emitRegularNode(node, resSym);
                    }
            }
        };
        this.code.line(`let ${resSym};`);
        if (this.options.introspect) {
            this.code.block('try {', '}', () => {
                emitBody();
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
            emitBody();
            this.code.line(`return ${resSym};`);
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

    private emitResultNode(node: Node, resSym: string) {
        const prop = node.getBasePropByKey('value')!;
        const expr = this.singlePropExpr(prop, this.graph.metadata.result);
        this.code.line(`${resSym} = ${expr};`);
    }

    private emitRegularNode(node: Node, resSym: string) {
        const defSym = this.getDefSym(node.ref);
        this.code.block(`${resSym} = ${this.awaitSym}${defSym}.compute({`, `}, ctx);`, () => {
            this.emitNodeProps(node);
        });
        if (this.isNodeCached(node)) {
            this.code.line(`ctx.$cache.set("${node.id}", { result: ${resSym} });`);
        }
    }

    private emitExpandedNode(node: Node, resSym: string) {
        const defSym = this.getDefSym(node.ref);
        // Expanded nodes always produce an array by
        // repeating the computation per each value of expanded property
        const props = [...node.computedProps()];
        const expandProps = props.filter(_ => _.isExpanded());
        this.code.line(`${resSym} = []`);
        const expSyms: string[] = [];
        for (const prop of expandProps) {
            const propSym = this.nextSym('p');
            this.symtable.set(`prop:${prop.id}`, propSym);
            expSyms.push(propSym);
            const linkKey = prop.linkKey;
            const linkNode = prop.getLinkNode()!;
            const linkExpr = this.nodeResultExpr(linkNode);
            const linkExpanded = linkNode.isExpanded();
            // Each expanded property needs to be awaited and converted into an array
            // taking `prop.linkKey` into account
            let expr;
            if (linkExpanded) {
                // The linked result is already an array, no need to convert
                if (linkKey) {
                    // The array needs to be mapped to `[linkKey]`
                    expr = `(${linkExpr}).map(_ => _[${JSON.stringify(prop.linkKey)}])`;
                } else {
                    expr = `${linkExpr}`;
                }
            } else if (linkKey) {
                expr = `${this.sym.toArray}((${linkExpr})[${JSON.stringify(prop.linkKey)}])`;
            } else {
                expr = `${this.sym.toArray}(${linkExpr})`;
            }
            this.code.line(`const ${propSym} = ${expr}`);
        }
        const cond = expSyms.map(s => `i < ${s}.length`).join(' && ');
        this.code.block(`for (let i = 0;${cond};i++) {`, `}`, () => {
            const tempSym = `$t`;
            this.code.block(`const ${tempSym} = ${this.awaitSym}${defSym}.compute({`, `}, ctx);`, () => {
                this.emitNodeProps(node);
            });
            this.code.line(`${resSym}.push(${tempSym});`);
        });
        if (this.isNodeCached(node)) {
            this.code.line(`ctx.$cache.set("${node.id}", { result: ${resSym} });`);
        }
    }

    private emitNodeProps(node: Node) {
        for (const prop of node.props) {
            if (prop.isUsesEntries()) {
                this.emitEntries(prop);
            } else {
                this.emitSingleProp(prop);
            }
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
            sourceSchema = linkNode.$def.metadata.result;
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
            return `${expSym}[i]`;
        }
        // The rest only applies to non-expanded properties
        let expr = JSON.stringify(String(prop.value));
        const linkNode = prop.getLinkNode();
        if (linkNode) {
            expr = this.nodeResultExpr(linkNode);
            if (prop.linkKey) {
                expr = `(${expr})[${JSON.stringify(prop.linkKey)}]`;
            }
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
            return `() => ${this.convertTypeExpr(param.default ?? '', param.schema)}`;
        }
        const targetSchema = linkNode.$def.metadata.result;
        const linkSym = this.getNodeSym(linkNode.id);
        const schemaCompatible = isSchemaCompatible(param.schema, targetSchema);
        return `${this.asyncSym}(p) => {
            const childCtx = ctx.$newScope(p);
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
        const cache = node.$def.metadata.cacheMode ?? 'auto';
        switch (cache) {
            case 'auto':
                return this.linkMap.get(node.id).size > 1;
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
