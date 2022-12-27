import { CompilerError } from './CompilerError.js';

export class CompilerSymbols {
    private symCounters = new Map<string, number>();
    private symtable = new Map<string, string>();

    getSym(id: string) {
        const sym = this.symtable.get(id);
        if (!sym) {
            throw new CompilerError(`Symbol not found: ${id}`);
        }
        return sym;
    }

    getNodeSym(nodeId: string) {
        return this.getSym(`node:${nodeId}`);
    }

    createNodeSym(nodeId: string) {
        const sym = this.nextSym('r');
        this.symtable.set(nodeId, sym);
        return sym;
    }

    getDefSym(moduleId: string) {
        return this.getSym(`def:${moduleId}`);
    }

    createDefSym(moduleId: string) {
        const sym = this.nextSym('n');
        this.symtable.set(`def:${moduleId}`, sym);
        return sym;
    }

    getLineSymIfExists(lineId: string) {
        return this.symtable.get(`prop:${lineId}`) ?? null;
    }

    createLineSym(lineId: string) {
        const sym = this.nextSym('p');
        this.symtable.set(`prop:${lineId}`, sym);
        return sym;
    }

    private nextSym(sym: string) {
        const c = this.symCounters.get(sym) ?? 0;
        this.symCounters.set(sym, c + 1);
        return `${sym}${c + 1}`;
    }
}
