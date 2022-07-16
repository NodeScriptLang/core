import { DeepPartial } from './deep-partial.js';
import { NodeMetadata } from './node-metadata.js';

export interface Graph {
    metadata: NodeMetadata;
    nodes: Node[];
    rootNodeId: string;
    refs: Record<string, string>;
}

export type GraphSpec = DeepPartial<Graph>;

export interface Node {
    id: string;
    ref: string;
    pos: { x: number; y: number };
    w: number;
    collapsed: boolean;
    props: Prop[];
}

export type NodeSpec = DeepPartial<Node>;

export interface Prop {
    id: string;
    key: string;
    value: string;
    linkId: string;
    linkKey: string;
    expand: boolean;
    entries?: Prop[];
}

export type PropSpec = DeepPartial<Prop>;

export type AddNodeSpec = {
    uri: string;
    node: NodeSpec;
};
