export class NotFoundError extends Error {
    name = this.constructor.name;
    status = 404;

    constructor(resourceName: string = 'Object') {
        super(`${resourceName} not found`);
    }
}
