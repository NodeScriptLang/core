import { ModuleSpec } from './module.js';

export interface GraphSpec {
    moduleSpec: ModuleSpec;
    nodes: {
        [id: string]: NodeSpec;
    };
    rootNodeId: string;
    metadata: Record<string, any>;
}

export interface NodeSpec {
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
