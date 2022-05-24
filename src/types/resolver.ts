import { NodeMetadata } from './defs.js';

export interface NodeResolver {
    resolveNode(ref: string): NodeMetadata;
}
