import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**', '.pm2/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            // `syngrisi` is a Playwright fixture requested only for its side effect
            // (it starts/stops the visual session), so an unused binding is intentional.
            '@typescript-eslint/no-unused-vars': ['error', {
                args: 'after-used',
                argsIgnorePattern: '^_|^syngrisi$',
                varsIgnorePattern: '^_',
            }],
        },
    },
);
