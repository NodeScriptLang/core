export class CompilerError extends Error {

    override name = this.constructor.name;
    status = 500;

}
