import { Schema } from '@nodescript/schema';

export type ModuleVersion = string;

export const ModuleVersionSchema = new Schema<ModuleVersion>({
    id: 'ModuleVersion',
    type: 'string',
    regex: /^[0-9]{1,6}\.[0-9]{1,6}\.[0-9]{1,6}$/.source,
    default: '1.0.0',
});
