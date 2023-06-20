import { Schema } from 'airtight';

export type ModuleName = string;

export const ModuleNameSchema = new Schema<ModuleName>({
    id: 'ModuleName',
    type: 'string',
    default: 'Untitled',
});
