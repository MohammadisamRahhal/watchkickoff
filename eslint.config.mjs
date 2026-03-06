// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Zero tolerance for any type — matches blueprint constraint
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // No direct process.env access — all env access via config/env.ts
      'no-process-env': 'error',

      // No console — all logging via Pino
      'no-console': 'error',

      // Enforce explicit return types on public functions
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],

      // No floating promises — must be awaited or explicitly void
      '@typescript-eslint/no-floating-promises': 'error',

      // Enforce exhaustive switch statements
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Consistent type imports
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'separate-type-imports',
      }],
    },
  },
  {
    // Relax rules for config files at root that cannot use the app's logger
    files: ['ecosystem.config.js', '*.config.mjs', '*.config.js'],
    rules: {
      'no-console': 'off',
      'no-process-env': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
