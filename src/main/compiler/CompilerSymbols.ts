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

    getNodeSym(nodeUid: string, fallback?: string) {
        return this.symtable.get(`node:${nodeUid}`, fallback);
    }

    createNodeSym(nodeUid: string) {
        const sym = this.symtable.nextSym('r');
        this.symtable.set(`node:${nodeUid}`, sym);
        return sym;
    }

    getLineSym(lineUid: string) {
        return this.symtable.get(`prop:${lineUid}`);
    }

    createLineSym(lineUid: string) {
        const sym = this.symtable.nextSym('p');
        this.symtable.set(`prop:${lineUid}`, sym);
        return sym;
    }

}
