export interface GraphEvalContext {
    $cache: Map<string, any>;
    getLocal(key: string): unknown;
}
