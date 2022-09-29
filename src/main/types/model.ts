import { DeepPartial } from '@flexent/schema';

import { ModuleSpec } from './module.js';

export type GraphRefs = Record<string, string>;

export interface GraphSpec {
    moduleSpec: ModuleSpec;
    nodes: NodeSpec[];
    rootNodeId: string;
    refs: GraphRefs;
    metadata: Record<string, any>;
}

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
    url: string;
    node: DeepPartial<NodeSpec>;
}
