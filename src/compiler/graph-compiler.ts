import { Graph, Node, Prop } from '../model/index.js';
import * as t from '../types/index.js';
import { NotFoundError, MultiMap, isSchemaCompatible } from '../util/index.js'

import { CodeBuilder } from './code.js';

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

export interface GraphCompilerOptions {
    comments: boolean;
    introspect: boolean;
}

/**
 * Compiles a graph into a JavaScript function.
 *
 * The result function signature is equivalent to NodeDef.compute
 * meaning that compiled graph is 100% compatible to Node definition.
 */
export class GraphCompiler {

    constructor(readonly $resolver: t.NodeResolver) {}

    compileGraphDef(graph: Graph, options: Partial<GraphCompilerOptions> = {}): t.NodeDef {
        const compute = this.compileGraphFn(graph, graph.rootNodeId, options);
        return {
            ref: graph.ref,
            category: graph.category,
            deprecated: graph.deprecated,
            description: graph.description,
            label: graph.label,
            hidden: graph.hidden,
            params: graph.params,
            returns: graph.returns,
            compute,
        };
    }

    compileGraphCode(graph: Graph, rootNodeId: string, options: Partial<GraphCompilerOptions> = {}) {
        const node = graph.getNodeById(rootNodeId);
        if (!node) {
            throw new NotFoundError('Node');
        }
        const gcc = new GraphCompilerContext(this, graph, node, options);
        return gcc.compile();
    }

    compileGraphFn(graph: Graph, rootNodeId: string, options: Partial<GraphCompilerOptions> = {}): t.NodeCompute<any, any> {
        const code = this.compileGraphCode(graph, rootNodeId, options);
        return this.createFunction(code);
    }

    protected createFunction(compiledCode: string) {
        return new AsyncFunction('params', 'ctx', compiledCode);
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
    depsMap: MultiMap<string, Node>;

    constructor(
        readonly compiler: GraphCompiler,
        readonly graph: Graph,
        readonly rootNode: Node,
        options: Partial<GraphCompilerOptions> = {},
    ) {
        this.options = {
            comments: false,
            introspect: false,
            ...options
        };
        this.order = graph.computeOrder(rootNode.id);
        this.depsMap = graph.getDepMap();
    }

    compile() {
        if (this.rootNode.ref === 'Comment') {
            return 'return undefined;';
        }
        this.emitHeader();
        this.emitDefinitions();
        this.emitComputations();
        this.emitResult();
        return this.code.toString();
    }

    protected emitHeader() {
        // This section destructures a few commonly used variables from ctx and
        // maps them to custom symbols to make the code shorter
        const resolver = this.nextSym('o');
        const nodeEvaluated = this.nextSym('o');
        const toArray = this.nextSym('o');
        const convertType = this.nextSym('o');
        this.symtable.set('resolver', resolver);
        this.symtable.set('nodeEvaluated', nodeEvaluated);
        this.symtable.set('toArray', toArray);
        this.symtable.set('convertType', convertType);
        this.code.line(`const {` +
          `resolver:${resolver},` +
          `nodeEvaluated:${nodeEvaluated},` +
          `lib: {` +
             `toArray:${toArray},` +
             `convertType:${convertType},` +
           `}` +
        `} = ctx;`);
    }

    protected emitDefinitions() {
        this.emitComment('Definitions');
        const refs = new Set(this.order.map(_ => _.ref));
        const resolverSym = this.getSym('resolver');
        for (const ref of refs) {
            if (['Param', 'Result'].includes(ref)) {
                continue;
            }
            const sym = this.nextSym('d');
            this.code.line(`const ${sym} = ${resolverSym}.resolveNode(${JSON.stringify(ref)});`);
            this.symtable.set(`def:${ref}`, sym);
        }
    }

    protected emitComputations() {
        this.emitComment('Computations');
        for (const node of this.order) {
            this.emitNode(node);
        }
    }

    protected emitResult() {
        this.emitComment('Result');
        const expr = this.nodeResultExpr(this.rootNode);
        this.code.line(`return ${expr};`);
    }

    protected emitNode(node: Node) {
        this.emitComment(`${node.ref} ${node.id}`);
        const sym = this.nextSym('r');
        this.symtable.set(`node:${node.id}`, sym);
        if (node.ref === 'Param') {
            // Param nodes are not emitted, accessed in-place
            return;
        }
        if (node.ref === 'Comment') {
            // Comment nodes are discarded
            return;
        }
        if (node.ref === 'Result') {
            // Result node needs a special type conversion defined by graph metadata
            return this.emitResultNode(node);
        }
        this.code.block(`async function ${sym}(ctx) {`, `}`, () => {
            if (this.isNodeCached(node.id)) {
                this.code.line(`const $c = ctx.$cache.get("${node.id}");`);
                this.code.line('if ($c) return $c;');
                this.code.block('try {', '}', () => {
                    this.emitNodeBody(node);
                });
                this.code.block('catch (err) {', '}', () => {
                    this.code.line(`ctx.cache.set("${node.id}", Promise.reject(err));`);
                    this.code.line(`throw err;`);
                });
            } else {
                this.emitNodeBody(node);
            }
        });
    }

    protected emitNodeBody(node: Node) {
        const emitBody = () => {
            if (node.isExpanded()) {
                this.emitExpandedNode(node);
            } else {
                this.emitRegularNode(node);
            }
        };
        if (this.options.introspect) {
            const nodeEvaluated = this.getSym('nodeEvaluated');
            this.code.block('try {', '}', () => {
                emitBody();
            });
            this.code.block('catch (error) {', '}', () => {
                this.code.line(`${nodeEvaluated}.emit({` +
                    `nodeId: ${JSON.stringify(node.id)},` +
                    `error,` +
                `});`);
                this.code.line('throw error;');
            });
        } else {
            emitBody();
        }
    }

    protected emitResultNode(node: Node) {
        const sym = this.getNodeSym(node.id);
        const prop = node.getBasePropByKey('value')!;
        const expr = this.singlePropExpr(prop, this.graph.returns);
        this.code.line(`async function ${sym}(ctx) {` +
            `return ${expr};` +
        `}`);
    }

    protected emitRegularNode(node: Node) {
        const defSym = this.getDefSym(node.ref);
        const resSym = `$r`;
        this.code.block(`const ${resSym} = ${defSym}.compute({`, `}, ctx);`, () => {
            this.emitNodeProps(node);
        });
        if (this.isNodeCached(node.id)) {
            this.code.line(`ctx.$cache.set("${node.id}", ${resSym});`);
        }
        if (this.options.introspect) {
            const nodeEvaluated = this.getSym('nodeEvaluated');
            this.code.line(`${nodeEvaluated}.emit({` +
                `nodeId: ${JSON.stringify(node.id)},` +
                `result: await ${resSym}` +
            `});`);
        }
        this.code.line(`return await ${resSym};`);
    }

    protected emitExpandedNode(node: Node) {
        const defSym = this.getDefSym(node.ref);
        const resSym = '$r';
        // Expanded nodes always produce an array by
        // repeating the computation per each value of expanded property
        const props = [...node.computedProps()];
        const expandProps = props.filter(_ => _.isExpanded());
        const toArray = this.getSym('toArray');
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
                expr = `${toArray}((${linkExpr})[${JSON.stringify(prop.linkKey)}])`;
            } else {
                expr = `${toArray}(${linkExpr})`;
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
            const nodeEvaluated = this.getSym('nodeEvaluated');
            this.code.line(`${nodeEvaluated}.emit({` +
                `nodeId: ${JSON.stringify(node.id)},` +
                `result: ${resSym}` +
            `});`);
        }
        this.code.line(`return ${resSym};`);
    }

    protected emitNodeProps(node: Node) {
        for (const prop of node.props) {
            if (prop.isUsesEntries()) {
                this.emitEntries(prop);
            } else {
                this.emitSingleProp(prop);
            }
        }
    }

    protected emitEntries(prop: Prop) {
        const { schema } = prop.$param;
        switch (schema.type) {
            case 'array':
                return this.emitArrayEntries(prop);
            case 'object':
                return this.emitObjectEntries(prop);
        }
    }

    protected emitArrayEntries(prop: Prop) {
        this.code.block(`${JSON.stringify(prop.key)}: [`, '],', () => {
            for (const p of prop.entries) {
                const expr = this.singlePropExpr(p);
                this.code.line(`${expr},`);
            }
        });
    }

    protected emitObjectEntries(prop: Prop) {
        this.code.block(`${JSON.stringify(prop.key)}: {`, '},', () => {
            for (const p of prop.entries) {
                const expr = this.singlePropExpr(p);
                this.code.line(`${JSON.stringify(p.key)}: ${expr},`);
            }
        });
    }

    protected emitSingleProp(prop: Prop) {
        const expr = this.singlePropExpr(prop);
        this.code.line(`${JSON.stringify(prop.key)}: ${expr},`);
    }

    protected singlePropExpr(prop: Prop, targetSchema: t.DataSchema = prop.getTargetSchema()) {
        if (prop.isLambda()) {
            return this.lambdaPropExpr(prop);
        }
        let expr = this.rawPropExpr(prop);
        let sourceSchema: t.DataSchema = { type: 'string' };
        const linkNode = prop.getLinkNode();
        if (linkNode) {
            sourceSchema = linkNode.$def.returns;
        }
        const needsTypeConversion = !isSchemaCompatible(targetSchema, sourceSchema);
        if (needsTypeConversion) {
            expr = this.convertTypeExpr(expr, targetSchema);
        }
        return expr;
    }

    protected convertTypeExpr(expr: string, targetSchema: t.DataSchema) {
        const convertTypeSym = this.getSym('convertType');
        return `${convertTypeSym}(${expr}, ${JSON.stringify(targetSchema)})`;
    }

    protected rawPropExpr(prop: Prop) {
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

    protected nodeResultExpr(node: Node) {
        if (node.ref === 'Param') {
            const prop = node.getBasePropByKey('key');
            const key = prop ? prop.value : '';
            return `params[${JSON.stringify(key)}]`;
        }
        const sym = this.getNodeSym(node.id);
        return `await ${sym}(ctx)`;
    }

    protected lambdaPropExpr(prop: Prop) {
        const param = prop.$param;
        const linkNode = prop.getLinkNode();
        if (!linkNode) {
            return `() => ${this.convertTypeExpr(param.default ?? '', param.schema)}`;
        }
        const targetSchema = linkNode.$def.returns;
        const linkSym = this.getNodeSym(linkNode.id);
        const schemaCompatible = isSchemaCompatible(param.schema, targetSchema);
        return schemaCompatible ?
            `p => ctx.$scoped(p, ${linkSym})` :
            `p => Promise.resolve(ctx.$scoped(p, ${linkSym}))` +
                `.then(res => ${this.convertTypeExpr('res', targetSchema)})`;
    }

    protected getNodeSym(nodeId: string) {
        return this.getSym(`node:${nodeId}`);
    }

    protected getDefSym(ref: string) {
        return this.getSym(`def:${ref}`);
    }

    protected getSym(id: string) {
        const sym = this.symtable.get(id);
        if (!sym) {
            throw new CompilerError(`Symbol not found: ${id}`);
        }
        return sym;
    }

    protected nextSym(sym: string) {
        const c = this.symCounters.get(sym) ?? 0;
        this.symCounters.set(sym, c + 1);
        return `${sym}${c + 1}`;
    }

    protected emitComment(str: string) {
        if (this.options.comments) {
            this.code.line(`// ${str}`);
        }
    }

    protected isNodeCached(nodeId: string) {
        return this.depsMap.get(nodeId).size > 1;
    }

}

export class CompilerError extends Error {
    status = 500;
    name = this.constructor.name;
}
