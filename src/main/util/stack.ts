export interface StackItem {
    symbol: string;
    source: string;
    graphId?: string;
    nodeUid?: string;
    scopeId?: string;
}

export function parseStack(stack: string): StackItem[] {
    const lines = stack.split('\n').filter(line => line.trim().startsWith('at'));
    const result: StackItem[] = [];
    for (const line of lines) {
        const match = /^\s*at(?:\s+async)?\s+(\S+)\s+\((.*)\)$/.exec(line);
        if (!match) {
            continue;
        }
        const symbol = match[1] ?? '';
        const source = match[2] ?? '';
        const graphId = symbol.startsWith('ns:') ? symbol.split(':')[1] : undefined;
        const nodeUid = symbol.startsWith('ns:') ? symbol.split(':').slice(2).join(':') : undefined;
        const scopeId = nodeUid ? nodeUid.substring(0, nodeUid.lastIndexOf(':')) : undefined;
        result.push({
            symbol,
            source,
            graphId,
            nodeUid,
            scopeId,
        });
    }
    return result;
}
