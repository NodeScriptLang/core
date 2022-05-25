import { Event } from './event.js';
import { NodeResult } from './node-result.js';

export interface GraphEvalContext {
    nodeEvaluated: Event<NodeResult>;
    getLocal(key: string): unknown;
}
