import { NodeHooks } from './node-hooks.js';
import { NodeMetadata } from './node-metadata.js';

export type NodeDef = {
    metadata: NodeMetadata;
    compute: (...args: any[]) => any;
    hooks?: NodeHooks;
};
