import { DeepPartial } from '@flexent/schema';

import { ModuleSpec } from './module.js';

export interface GraphSpec {
    moduleSpec: ModuleSpec;
    nodes: NodeSpec[];
    rootNodeId: string;
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
