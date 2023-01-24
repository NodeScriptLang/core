import assert from 'assert';

import { GraphCompiler } from '../../main/compiler/GraphCompiler.js';
import { GraphEvalContext } from '../../main/runtime/GraphEvalContext.js';
import { ModuleSpecSchema } from '../../main/schema/ModuleSpec.js';
import { ModuleParamSpec } from '../../main/types/module.js';
import { codeToUrl, evalEsmModule } from '../../main/util/eval.js';
import { runtime } from '../runtime.js';

describe('Compiler: types', () => {

    context('basics', () => {

        it('converts types when schemas do not match', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    res: {
                        ref: 'Number',
                        props: {
                            value: { linkId: 'p' },
                        }
                    },
                    p: {
                        ref: 'String',
                        props: {
                            value: { value: '42' },
                        }
                    }
                },
            });
            const { code } = new GraphCompiler().compileEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res = await compute({}, ctx);
            assert.strictEqual(res, 42);
        });

        it('does not convert types when schemas are compatible', async () => {
            const graph = await runtime.loadGraph({
                rootNodeId: 'res',
                nodes: {
                    res: {
                        ref: 'Any',
                        props: {
                            value: { linkId: 'p' },
                        }
                    },
                    p: {
                        ref: '@system/Param',
                        props: {
                            key: { value: 'value' },
                        }
                    }
                },
            });
            const { code } = new GraphCompiler().compileEsm(graph);
            const { compute } = await evalEsmModule(code);
            const ctx = new GraphEvalContext();
            const res1 = await compute({ value: true }, ctx);
            assert.strictEqual(res1, true);
            const res2 = await compute({ value: 42 }, ctx);
            assert.strictEqual(res2, 42);
            const res3 = await compute({ value: { foo: 123 } }, ctx);
            assert.deepStrictEqual(res3, { foo: 123 });
        });

    });

    context('static conversions', () => {

        it('type: any', async () => {
            const paramSpec: Partial<ModuleParamSpec> = {
                schema: {
                    type: 'any'
                }
            };
            await testStaticConversion(paramSpec, '', '');
            await testStaticConversion(paramSpec, 'undefined', undefined);
            await testStaticConversion(paramSpec, 'null', null);
            await testStaticConversion(paramSpec, '42', 42);
            await testStaticConversion(paramSpec, 'false', false);
            await testStaticConversion(paramSpec, 'true', true);
            await testStaticConversion(paramSpec, '{}', {});
            await testStaticConversion(paramSpec, '[]', []);
            await testStaticConversion(paramSpec, 'hello', 'hello');
        });

        it('type: any, optional: true', async () => {
            const paramSpec: Partial<ModuleParamSpec> = {
                schema: {
                    type: 'any',
                    optional: true,
                }
            };
            await testStaticConversion(paramSpec, '', undefined);
            await testStaticConversion(paramSpec, 'undefined', undefined);
            await testStaticConversion(paramSpec, 'null', null);
            await testStaticConversion(paramSpec, '42', 42);
            await testStaticConversion(paramSpec, 'false', false);
            await testStaticConversion(paramSpec, 'true', true);
            await testStaticConversion(paramSpec, '{}', {});
            await testStaticConversion(paramSpec, '[]', []);
            await testStaticConversion(paramSpec, 'hello', 'hello');
        });

        it('type: any, nullable: true', async () => {
            const paramSpec: Partial<ModuleParamSpec> = {
                schema: {
                    type: 'any',
                    nullable: true,
                }
            };
            await testStaticConversion(paramSpec, '', null);
            await testStaticConversion(paramSpec, 'undefined', undefined);
            await testStaticConversion(paramSpec, 'null', null);
            await testStaticConversion(paramSpec, '42', 42);
            await testStaticConversion(paramSpec, 'false', false);
            await testStaticConversion(paramSpec, 'true', true);
            await testStaticConversion(paramSpec, '{}', {});
            await testStaticConversion(paramSpec, '[]', []);
            await testStaticConversion(paramSpec, 'hello', 'hello');
        });

        it('type: any, optional: true, nullable: true', async () => {
            const paramSpec: Partial<ModuleParamSpec> = {
                schema: {
                    type: 'any',
                    optional: true,
                    nullable: true,
                }
            };
            await testStaticConversion(paramSpec, '', undefined);
            await testStaticConversion(paramSpec, 'undefined', undefined);
            await testStaticConversion(paramSpec, 'null', null);
            await testStaticConversion(paramSpec, '42', 42);
            await testStaticConversion(paramSpec, 'false', false);
            await testStaticConversion(paramSpec, 'true', true);
            await testStaticConversion(paramSpec, '{}', {});
            await testStaticConversion(paramSpec, '[]', []);
            await testStaticConversion(paramSpec, 'hello', 'hello');
        });

        it('type: string', async () => {
            const paramSpec: Partial<ModuleParamSpec> = {
                schema: {
                    type: 'string',
                }
            };
            await testStaticConversion(paramSpec, '', '');
            await testStaticConversion(paramSpec, '42', '42');
            await testStaticConversion(paramSpec, 'hello', 'hello');
        });

        it('type: string, optional: true', async () => {
            const paramSpec: Partial<ModuleParamSpec> = {
                schema: {
                    type: 'string',
                    optional: true,
                }
            };
            await testStaticConversion(paramSpec, '', undefined);
            await testStaticConversion(paramSpec, '42', '42');
            await testStaticConversion(paramSpec, 'hello', 'hello');
        });

        it('type: string, nullable: true', async () => {
            const paramSpec: Partial<ModuleParamSpec> = {
                schema: {
                    type: 'string',
                    nullable: true,
                }
            };
            await testStaticConversion(paramSpec, '', null);
            await testStaticConversion(paramSpec, '42', '42');
            await testStaticConversion(paramSpec, 'hello', 'hello');
        });

        it('type: number', async () => {
            const paramSpec: Partial<ModuleParamSpec> = {
                schema: {
                    type: 'number',
                }
            };
            await testStaticConversion(paramSpec, '', 0);
            await testStaticConversion(paramSpec, '42', 42);
        });

        it('type: number, optional: true', async () => {
            const paramSpec: Partial<ModuleParamSpec> = {
                schema: {
                    type: 'number',
                    optional: true,
                }
            };
            await testStaticConversion(paramSpec, '', undefined);
            await testStaticConversion(paramSpec, '42', 42);
        });

        it('type: number, nullable: true', async () => {
            const paramSpec: Partial<ModuleParamSpec> = {
                schema: {
                    type: 'number',
                    nullable: true,
                }
            };
            await testStaticConversion(paramSpec, '', null);
            await testStaticConversion(paramSpec, '42', 42);
        });

    });

});

async function testStaticConversion(paramSpec: Partial<ModuleParamSpec>, input: any, output: any) {
    const loader = await createLoaderWithModule(paramSpec);
    const graph = await runtime.loadGraphWithLoader(loader, {
        rootNodeId: 'res',
        nodes: {
            res: {
                ref: 'Echo',
                props: {
                    val: {
                        value: input,
                    }
                }
            }
        }
    });
    const { code } = new GraphCompiler().compileEsm(graph);
    const { compute } = await evalEsmModule(code);
    const ctx = new GraphEvalContext();
    const res = compute({}, ctx);
    assert.deepStrictEqual(res.val, output);
}

async function createLoaderWithModule(paramSpec: Partial<ModuleParamSpec>) {
    const loader = await runtime.createLoader();
    loader.addModule('Echo', ModuleSpecSchema.create({
        moduleName: 'Echo',
        params: {
            val: paramSpec,
        },
        result: {
            schema: { type: 'any' },
        },
        attributes: {
            customImportUrl: codeToUrl('export const compute = params => params')
        },
    }));
    return loader;
}
