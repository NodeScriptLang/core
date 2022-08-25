import { Node } from './model.js';

export type NodeCompile = (this: void, node: Node, ctx: NodeCompileContext) => void;

export type NodeCompileContext = {
    emitBlock(start: string, end: string, fn: () => void): void;
    emitLine(line: string): void;
    emitProp(key: string): void;
    sym: NodeCompileSymbols;
};

export type NodeCompileSymbols = {
    result: string;
    ctx: string;
};
