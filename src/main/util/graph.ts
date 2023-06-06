import { ModuleSpecSchema } from '../schema/ModuleSpec.js';
import { ModuleSubgraphSpec } from '../types/module.js';

export function createSubgraphModuleSpec(subgraph: ModuleSubgraphSpec) {
    return ModuleSpecSchema.create({
        // TODO add param specs if/when necessary
        result: {
            schema: {
                type: 'object',
                properties: subgraph.output,
            },
        }
    });
}
