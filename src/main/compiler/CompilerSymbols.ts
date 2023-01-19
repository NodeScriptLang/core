import { CompilerError } from './CompilerError.js';

export class CompilerSymbols {
    private symCounters = new Map<string, number>();
    private symtable = new Map<string, string>();

    getDefSym(moduleRef: string) {
        return this.get(`def:${moduleRef}`);
    }

    createDefSym(moduleRef: string) {
        const sym = this.nextSym('d');
        this.set(`def:${moduleRef}`, sym);
        return sym;
    }

    getNodeSym(scopeId: string, nodeId: string, fallback?: string) {
        return this.get(`node:${scopeId}:${nodeId}`, fallback);
    }

    createNodeSym(scopeId: string, nodeId: string) {
        const sym = this.nextSym('r');
        this.set(`node:${scopeId}:${nodeId}`, sym);
        return sym;
    }

    getLineSymIfExists(scopeId: string, lineId: string) {
        return this.get(`prop:${scopeId}:${lineId}`, '');
    }

    createLineSym(scopeId: string, lineId: string) {
        const sym = this.nextSym('p');
        this.set(`prop:${scopeId}:${lineId}`, sym);
        return sym;
    }

    private get(id: string, fallback?: string) {
        const sym = this.symtable.get(id);
        if (sym == null) {
            if (fallback == null) {
                throw new CompilerError(`Symbol not found: ${id}`);
            }
            return fallback;
        }
        return sym;
    }

    private set(id: string, sym: string) {
        this.symtable.set(id, sym);
    }

    private nextSym(sym: string) {
        const c = this.symCounters.get(sym) ?? 0;
        this.symCounters.set(sym, c + 1);
        return `${sym}${c + 1}`;
    }

}
