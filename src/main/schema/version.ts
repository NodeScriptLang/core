import { Schema } from 'airtight';

export const VersionSchema = new Schema<string>({
    id: 'Version',
    type: 'string',
    regex: /^(\d+)\.(\d+)\.(\d+)(-[a-z0-9_-]+)?$/.source,
    default: '1.0.0',
});
