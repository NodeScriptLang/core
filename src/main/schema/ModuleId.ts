import { Schema } from 'airtight';

import { standardId } from '../util/id.js';

export type ModuleId = string;

export const ModuleIdSchema = new Schema<ModuleId>({
    id: 'ModuleId',
    type: 'string',
    regex: /^(?:@[a-z0-9]{1,16}\/)?(?:[a-zA-Z0-9.]{1,64})$/.source,
    default: () => standardId(),
});
