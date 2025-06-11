import eslint from '@eslint/js';
import type { ESLint, Linter } from 'eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const commonConfig: Linter.Config = {
  files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
  languageOptions: {
    sourceType: 'module',
    globals: {
      ...globals.browser,
      ...globals.node,
      React: 'readonly',
      JSX: 'readonly',
    },
  },
  rules: {
    'key-spacing': ['error', { align: 'value' }],
    'no-constant-condition': 'warn',
    'prefer-spread': 'off',
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
  },
};

const typescriptConfig: Linter.Config = {
  files: ['**/*.ts', '**/*.tsx'],
  plugins: {
    '@typescript-eslint': tseslint.plugin as unknown as ESLint.Plugin,
  },
  languageOptions: {
    parser: tseslint.parser as unknown as Linter.Parser,
    parserOptions: {
      projectService: true,
    },
  },
  rules: {
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false,
        },
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
      },
    ],
  },
};

const simpleImportSortConfig: Linter.Config = {
  files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
  plugins: {
    'simple-import-sort': simpleImportSort,
  },
  rules: {
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
  },
};

const unusedImportsConfig: Linter.Config = {
  files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
  plugins: {
    'unused-imports': unusedImports as unknown as ESLint.Plugin,
  },
  rules: {
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
  },
};

const reactConfig: Linter.Config = {
  files: ['**/*.{jsx,tsx}'],
  plugins: {
    react: reactPlugin,
    'react-hooks': reactHooksPlugin,
    'react-refresh': reactRefresh,
  },
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
};

export default [
  {
    ignores: ['**/node_modules/', '.git/', 'build/*', 'dist/*'],
  },
  eslint.configs.recommended,
  commonConfig,
  typescriptConfig,
  simpleImportSortConfig,
  unusedImportsConfig,
  reactConfig,
  eslintPluginPrettierRecommended,
];
