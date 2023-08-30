import { ProfileSpanType } from '../types/ctx.js';

export type GraphProfilerSpan = [ProfileSpanType, string, number];

/**
 * Base functionality for collecting profiler spans.
 * Defaults to no-op.
 */
export class GraphProfiler {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    collectSpan(spanId: string, type: ProfileSpanType) {}
}

export class InMemoryGraphProfiler extends GraphProfiler {
    spans: GraphProfilerSpan[] = [];

    override collectSpan(spanId: string, type: ProfileSpanType): void {
        this.spans.push([type, spanId, performance.now()]);
    }

}
