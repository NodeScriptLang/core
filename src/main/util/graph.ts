import { ModuleSpecSchema } from '../schema/ModuleSpec.js';
import { ModuleSubgraphSpec } from '../types/module.js';

export function createSubgraphModuleSpec(subgraph: ModuleSubgraphSpec) {
    const paramEntries = Object.entries(subgraph.input).map(([key, schema]) => {
        return [key, { schema }];
    });
    return ModuleSpecSchema.create({
        params: Object.fromEntries(paramEntries),
        result: {
            schema: subgraph.output,
        }
    });
}
