import { ModuleSpec } from './module.js';

export interface GraphSpec {
    module: ModuleSpec;
    nodes: NodeSpec[];
    rootNodeId: string;
    refs: GraphRefs;
    metadata: GraphMetadata;
}

export type GraphRefs = Record<string, string>;
export type GraphMetadata = Record<string, string>;

export interface NodeSpec {
    id: string;
    ref: string;
    props: PropSpec[];
    metadata: Record<string, any>;
}

export interface PropSpec {
    id: string;
    key: string;
    value: string;
    linkId?: string;
    expand: boolean;
    entries?: PropSpec[];
}

export interface AddNodeSpec {
    uri: string;
    node: NodeSpec;
}
