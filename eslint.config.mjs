import { sharedConfigs } from '@nodescript/eslint-config';

export default [
    ...sharedConfigs,
    {
        rules: {
            '@typescript-eslint/consistent-type-definitions': 'off'
        }
    }
];
