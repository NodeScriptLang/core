import { NodeDef } from './defs.js';

export interface Graph extends NodeDef {
    nodes: Node[];
    rootNodeId: string;
    refs: Record<string, string>;
}

export interface Node {
    id: string;
    ref: string;
    pos: { x: number; y: number };
    w: number;
    collapsed: boolean;
    props: Prop[];
}

export interface Prop {
    id: string;
    key: string;
    value: string;
    linkId: string;
    linkKey: string;
    expand: boolean;
    entries?: Prop[];
}
