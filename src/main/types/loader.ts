import { DeepPartial } from './deep-partial.js';
import { NodeDef } from './defs.js';
import { Graph } from './model.js';

export interface GraphLoader {
    loadGraph(spec: DeepPartial<Graph>): Promise<Graph>;
    loadNodeDef(uri: string): Promise<NodeDef>;
    resolveNodeDef(uri: string): NodeDef;
}
