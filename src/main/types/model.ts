import { ModuleSpec, NodeEvalMode } from './module.js';
import { Point } from './point.js';

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
    metadata: NodeMetadata;
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

export interface NodeMetadata {
    pos: Point;
    w: number;
    h: number;
    label: string;
    collapsed: boolean;
    evalMode?: NodeEvalMode;
    [key: string]: any;
}
