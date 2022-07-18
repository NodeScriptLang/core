import { NodeResult } from './node-result.js';

export interface NodeHooks {
    mount?(state: Record<string, any>, el: HTMLElement): void | Promise<void>;
    unmount?(state: Record<string, any>): void | Promise<void>;
    update?(state: Record<string, any>, result: NodeResult): void | Promise<void>;
}
