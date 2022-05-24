export class NotFoundError extends Error {
    status = 404;

    constructor(resourceName: string = 'Object') {
        super(`${resourceName} not found`);
        this.name = this.constructor.name;
    }
}
