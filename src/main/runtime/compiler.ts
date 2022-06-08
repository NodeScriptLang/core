import { Graph, Node, NodeLink, Prop } from '../model/index.js';
import * as t from '../types/index.js';
import { isSchemaCompatible, MultiMap } from '../util/index.js';
import { CodeBuilder } from './code.js';

export interface GraphCompilerOptions {
    rootNodeId: string;
    comments: boolean;
    introspect: boolean;
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

    // Commonly used symbols
    sym = {
        nodeEvaluated: this.nextSym('o'),
        toArray: this.nextSym('o'),
        convertType: this.nextSym('o'),
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
            ...options
        };
        this.order = graph.computeOrder(rootNode.id);
        this.linkMap = graph.computeLinkMap();
    }

    compileEsm() {
        this.emitImports();
        this.emitExportNode();
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

    private emitExportNode() {
        this.emitComment('Node Definition');
        this.code.block('export const node = {', '};', () => {
            this.emitGraphMetadata();
            this.code.block('async compute(params, ctx) {', '}', () => {
                this.emitComputeBody();
            });
        });
    }

    private emitGraphMetadata() {
        this.code.line(`metadata: ${JSON.stringify(this.graph.metadata)},`);
    }

    private emitComputeBody() {
        this.emitCtxLocals();
        for (const node of this.order) {
            this.emitNode(node);
        }
        this.emitResult();
    }

    private emitCtxLocals() {
        // These locals are accessed by the code within `compute` function
        this.symtable.set('nodeEvaluated', this.sym.nodeEvaluated);
        this.symtable.set('toArray', this.sym.toArray);
        this.symtable.set('convertType', this.sym.convertType);
        this.code.line(`const {` +
          `$nodeEvaluated: ${this.sym.nodeEvaluated},` +
          `$toArray: ${this.sym.toArray},` +
          `$convertType: ${this.sym.convertType},` +
        `} = ctx;`);
    }

    private emitResult() {
        this.emitComment('Result');
        const expr = this.nodeResultExpr(this.rootNode);
        this.code.line(`return ${expr};`);
    }

    private emitNode(node: Node) {
        this.emitComment(`${node.ref} ${node.id}`);
        const sym = this.nextSym('r');
        this.symtable.set(`node:${node.id}`, sym);
        if (node.$uri.startsWith('core:')) {
            return this.emitCoreNode(node);
        }
        this.code.block(`async function ${sym}(ctx) {`, `}`, () => {
            if (this.isNodeCached(node.id)) {
                this.code.line(`const $c = ctx.$cache.get("${node.id}");`);
                this.code.line('if ($c) return $c;');
                this.code.block('try {', '}', () => {
                    this.emitNodeBody(node);
                });
                this.code.block('catch (err) {', '}', () => {
                    this.code.line(`ctx.$cache.set("${node.id}", Promise.reject(err));`);
                    this.code.line(`throw err;`);
                });
            } else {
                this.emitNodeBody(node);
            }
        });
    }

    private emitCoreNode(node: Node) {
        switch (node.$uri) {
            // Param nodes are not emitted, "params" sym is accessed in-place
            case 'core:Param':
                return;
            // Comment nodes are discarded
            case 'core:Comment':
                return;
            case 'core:Result':
                return this.emitResultNode(node);
            case 'core:Local':
                return this.emitLocalNode(node);
        }
    }

    private emitNodeBody(node: Node) {
        const emitBody = () => {
            if (node.isExpanded()) {
                this.emitExpandedNode(node);
            } else {
                this.emitRegularNode(node);
            }
        };
        if (this.options.introspect) {
            this.code.block('try {', '}', () => {
                emitBody();
            });
            this.code.block('catch (error) {', '}', () => {
                this.code.line(`${this.sym.nodeEvaluated}.emit({` +
                    `nodeId: ${JSON.stringify(node.id)},` +
                    `error,` +
                `});`);
                this.code.line('throw error;');
            });
        } else {
            emitBody();
        }
    }

    private emitResultNode(node: Node) {
        const sym = this.getNodeSym(node.id);
        const prop = node.getBasePropByKey('value')!;
        const expr = this.singlePropExpr(prop, this.graph.metadata.result);
        this.code.line(`async function ${sym}(ctx) {` +
            `return ${expr};` +
        `}`);
    }

    private emitLocalNode(node: Node) {
        const sym = this.getNodeSym(node.id);
        const prop = node.getBasePropByKey('key')!;
        this.code.line(`async function ${sym}(ctx) {` +
            `return ctx.getLocal(${JSON.stringify(prop.value)});` +
        `}`);
    }

    private emitRegularNode(node: Node) {
        const defSym = this.getDefSym(node.ref);
        const resSym = `$r`;
        this.code.block(`const ${resSym} = ${defSym}.compute({`, `}, ctx);`, () => {
            this.emitNodeProps(node);
        });
        if (this.isNodeCached(node.id)) {
            this.code.line(`ctx.$cache.set("${node.id}", ${resSym});`);
        }
        if (this.options.introspect) {
            this.code.line(`${this.sym.nodeEvaluated}.emit({` +
                `nodeId: ${JSON.stringify(node.id)},` +
                `result: await ${resSym}` +
            `});`);
        }
        this.code.line(`return await ${resSym};`);
    }

    private emitExpandedNode(node: Node) {
        const defSym = this.getDefSym(node.ref);
        const resSym = '$r';
        // Expanded nodes always produce an array by
        // repeating the computation per each value of expanded property
        const props = [...node.computedProps()];
        const expandProps = props.filter(_ => _.isExpanded());
        this.code.line(`const ${resSym} = []`);
        const expSyms: string[] = [];
        for (const prop of expandProps) {
            const propSym = this.nextSym('p');
            this.symtable.set(`prop:${prop.id}`, propSym);
            expSyms.push(propSym);
            const linkKey = prop.linkKey;
            const linkNode = prop.getLinkNode()!;
            const linkExpr = this.nodeResultExpr(linkNode);
            const linkExpanded = linkNode.isExpanded();
            // Each expanded property needs to be awaited and converted into an array;
            // taking `prop.linkKey` into an account
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
            this.code.block(`const ${tempSym} = ${defSym}.compute({`, `}, ctx);`, () => {
                this.emitNodeProps(node);
            });
            this.code.line(`${resSym}.push(await ${tempSym});`);
        });
        if (this.isNodeCached(node.id)) {
            this.code.line(`ctx.$cache.set("${node.id}", ${resSym});`);
        }
        if (this.options.introspect) {
            this.code.line(`${this.sym.nodeEvaluated}.emit({` +
                `nodeId: ${JSON.stringify(node.id)},` +
                `result: ${resSym}` +
            `});`);
        }
        this.code.line(`return ${resSym};`);
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

    private singlePropExpr(prop: Prop, targetSchema: t.DataSchema = prop.getTargetSchema()) {
        if (prop.isLambda()) {
            return this.lambdaPropExpr(prop);
        }
        let expr = this.rawPropExpr(prop);
        let sourceSchema: t.DataSchema = { type: 'string' };
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

    private convertTypeExpr(expr: string, targetSchema: t.DataSchema) {
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
        if (node.$uri === 'core:Param') {
            const prop = node.getBasePropByKey('key');
            const key = prop ? prop.value : '';
            return `params[${JSON.stringify(key)}]`;
        }
        const sym = this.getNodeSym(node.id);
        return `await ${sym}(ctx)`;
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
        return schemaCompatible ?
            `p => ctx.$scoped(p, ${linkSym})` :
            `p => Promise.resolve(ctx.$scoped(p, ${linkSym}))` +
                `.then(res => ${this.convertTypeExpr('res', targetSchema)})`;
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

    private isNodeCached(nodeId: string) {
        return this.linkMap.get(nodeId).size > 1;
    }

}

export class CompilerError extends Error {
    name = this.constructor.name;
    status = 500;
}
