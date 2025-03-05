import { GraphView } from '../runtime/index.js';
import { ModuleSpec } from '../types/index.js';
import { CompilerJob } from './CompilerJob.js';

export interface CompilerOptions {
    graphId?: string;
    comments: boolean;
    introspect: boolean;
    emitNodeMap: boolean;
    emitAll: boolean;
}

export interface CompilerResult {
    code: string;
    moduleSpec: ModuleSpec;
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

    compileEsm(graphView: GraphView, options: Partial<CompilerOptions> = {}): CompilerResult {
        const job = new CompilerJob(graphView, {
            comments: false,
            introspect: false,
            emitNodeMap: false,
            emitAll: false,
            ...options,
        });
        job.run();
        return {
            code: job.getEmittedCode(),
            moduleSpec: job.getModuleSpec(),
        };
    }

}
