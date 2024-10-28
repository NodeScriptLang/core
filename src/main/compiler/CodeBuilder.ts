export class CodeBuilder {

    buffer: string[] = [];

    constructor(
        readonly indentString = '  ',
        public currentIndent = 0,
    ) {}

    toString() {
        return this.buffer.join('');
    }

    push(str: string) {
        this.buffer.push(str);
        return this;
    }

    pushIndent() {
        this.buffer.push(this.indentString.repeat(this.currentIndent));
        return this;
    }

    line(str: string) {
        this.pushIndent();
        this.push(str);
        this.push('\n');
        return this;
    }

    indent(step = 1) {
        this.currentIndent += step;
        return this;
    }

    block(start: string, end: string, fn: () => void) {
        this.line(start);
        this.indent();
        fn();
        this.indent(-1);
        this.line(end);
    }

    compose(async: boolean, expr: string, wrap: (str: string) => string) {
        return async ? this.composeAsync(expr, wrap) : this.composeSync(expr, wrap);
    }

    composeSync(expr: string, wrap: (str: string) => string) {
        return wrap(expr);
    }

    composeAsync(expr: string, wrap: (str: string) => string) {
        return `${expr}.then(_ => ${wrap('_')})`;
    }

}
