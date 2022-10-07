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
    props: {
        [key: string]: PropSpec;
    };
    metadata: Record<string, any>;
}

export interface PropSpec {
    value: string;
    linkId?: string;
    expand: boolean;
    entries?: PropEntrySpec[];
}

export interface PropEntrySpec {
    id: string;
    key: string;
    value: string;
    linkId?: string;
    expand: boolean;
}
