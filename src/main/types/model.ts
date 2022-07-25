import { DeepPartial } from './deep-partial.js';
import { NodeMetadata } from './node-metadata.js';

export interface Graph {
    metadata: NodeMetadata;
    nodes: Node[];
    rootNodeId: string;
    refs: Record<string, string>;
    aux: Record<string, any>;
}

export type GraphSpec = DeepPartial<Graph>;

export interface Node {
    id: string;
    ref: string;
    props: Prop[];
    aux: Record<string, any>;
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
