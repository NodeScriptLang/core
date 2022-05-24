import { NodeMetadata } from './defs.ts';

export interface NodeResolver {
    resolveNode(ref: string): NodeMetadata;
}
