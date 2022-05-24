import { DataSchema } from "./data.ts";
import { NodeMetadata, ParamMetadata } from "./defs.ts";

export interface Graph extends NodeMetadata {
    label: string;
    category: string[];
    description: string;
    nodes: Node[];
    params: Record<string, ParamMetadata>;
    returns: DataSchema<any>;
    rootNodeId: string;
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
