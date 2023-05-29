import { ModuleSpec } from './module.js';
import { Point } from './point.js';

export interface GraphSpec {
    moduleSpec: ModuleSpec;
    rootNodeId: string;
    nodes: Record<string, NodeSpec>;
    metadata: Record<string, any>;
}

export interface SubgraphSpec {
    rootNodeId: string;
    nodes: Record<string, NodeSpec>;
    metadata: Record<string, any>;
}

export interface NodeSpec {
    ref: string;
    props: Record<string, PropSpec>;
    metadata: NodeMetadata;
    subgraph?: SubgraphSpec;
}

export interface PropSpec {
    value: string;
    linkId?: string;
    linkKey?: string;
    expand: boolean;
    entries?: PropEntrySpec[];
}

export interface PropEntrySpec {
    id: string;
    key: string;
    value: string;
    linkId?: string;
    linkKey?: string;
    expand: boolean;
}

export interface NodeMetadata {
    pos: Point;
    w: number;
    h: number;
    label: string;
    collapsed: boolean;
    listedProps: Record<string, boolean>;
    [key: string]: any;
}
