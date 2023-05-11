import { SymTable } from './SymTable.js';

export class CompilerSymbols {

    private symtable = new SymTable();

    getComputeSym(moduleRef: string) {
        return this.symtable.get(`compute:${moduleRef}`);
    }

    createComputeSym(moduleRef: string) {
        const sym = this.symtable.nextSym('d');
        this.symtable.set(`compute:${moduleRef}`, sym);
        return sym;
    }

    getModuleSym(moduleRef: string) {
        return this.symtable.get(`module:${moduleRef}`);
    }

    createModuleSym(moduleRef: string) {
        const sym = this.symtable.nextSym('d');
        this.symtable.set(`module:${moduleRef}`, sym);
        return sym;
    }

    getNodeSym(scopeId: string, nodeId: string, fallback?: string) {
        return this.symtable.get(`node:${scopeId}:${nodeId}`, fallback);
    }

    createNodeSym(scopeId: string, nodeId: string) {
        const sym = this.symtable.nextSym('r');
        this.symtable.set(`node:${scopeId}:${nodeId}`, sym);
        return sym;
    }

    getLineSym(scopeId: string, lineId: string) {
        return this.symtable.get(`prop:${scopeId}:${lineId}`);
    }

    createLineSym(scopeId: string, lineId: string) {
        const sym = this.symtable.nextSym('p');
        this.symtable.set(`prop:${scopeId}:${lineId}`, sym);
        return sym;
    }

}
