import { Operator } from '../../main/types/index.js';

export const node: Operator<{
    args: Record<string, unknown>;
    code: string;
}, unknown> = {
    metadata: {
        name: 'Eval',
        label: 'Eval',
        params: {
            args: {
                schema: {
                    type: 'object',
                },
            },
            code: {
                schema: {
                    type: 'string',
                    kind: 'javascript',
                },
            }
        },
        result: {
            type: 'any',
        },
    },
    compute() {},
    compile(node, ctx) {
        ctx.emitBlock(`const $p = {`, `}`, () => {
            ctx.emitProp('args');
        });
        const code = node.props.find(_ => _.key === 'code')?.value ?? '';
        const args = node.props.find(_ => _.key === 'args')?.entries ?? [];
        const argList = args.map(_ => _.key).join(',');
        const argVals = args.map(_ => `$p.args[${JSON.stringify(_.key)}]`).join(',');
        ctx.emitBlock(`${ctx.sym.result} = ((${argList}) => {`, `})(${argVals})`, () => {
            ctx.emitLine(code);
        });
    }
};
