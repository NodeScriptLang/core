import { NodeDef } from './defs.js';
import { Graph, GraphSpec } from './model.js';

export interface GraphLoader {
    loadGraph(spec: GraphSpec): Promise<Graph>;
    loadNodeDef(uri: string): Promise<NodeDef>;
    resolveNodeDef(uri: string): NodeDef;
}
