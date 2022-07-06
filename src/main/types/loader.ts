import { Graph, GraphSpec } from './model.js';
import { NodeDef } from './node-def.js';

export interface GraphLoader {
    loadGraph(spec: GraphSpec): Promise<Graph>;
    loadNodeDef(uri: string): Promise<NodeDef>;
    resolveNodeDef(uri: string): NodeDef;
}
