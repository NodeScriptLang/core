import { Event } from './event.ts';
import { NodeResult } from './node-result.ts';

export interface GraphEvalContext {
    nodeEvaluated: Event<NodeResult>;
    getLocal(key: string): unknown;
}
