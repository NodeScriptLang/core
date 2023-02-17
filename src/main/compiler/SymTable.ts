import { CompilerError } from './CompilerError.js';

export class SymTable {
    symCounters = new Map<string, number>();
    symtable = new Map<string, string>();

    get(id: string, fallback?: string) {
        const sym = this.symtable.get(id);
        if (sym == null) {
            if (fallback == null) {
                throw new CompilerError(`Symbol not found: ${id}`);
            }
            return fallback;
        }
        return sym;
    }

    set(id: string, sym: string) {
        this.symtable.set(id, sym);
    }

    nextSym(sym: string) {
        const c = this.symCounters.get(sym) ?? 0;
        this.symCounters.set(sym, c + 1);
        return `${sym}${c + 1}`;
    }

}
