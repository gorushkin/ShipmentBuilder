import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier/flat'
import mobx from 'eslint-plugin-mobx'
import perfectionist from 'eslint-plugin-perfectionist'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const sorting = { type: 'alphabetical', order: 'asc', ignoreCase: true }

export default defineConfig([
  globalIgnores(['dist', 'node_modules', '.codex', 'openspec']),
  {
    files: ['*.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'vite.config.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { mobx, perfectionist, 'unused-imports': unusedImports },
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'no-console': ['error', { allow: ['error', 'info'] }],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'mobx/unconditional-make-observable': 'error',
      'perfectionist/sort-imports': [
        'warn',
        {
          ...sorting,
          internalPattern: ['^@/'],
          customGroups: [{ groupName: 'react', elementNamePattern: '^react(?:-dom)?(?:/|$)' }],
          groups: [
            'react',
            ['builtin', 'external'],
            'internal',
            ['parent', 'sibling', 'index'],
            'unknown',
          ],
          newlinesBetween: 1,
          sortSideEffects: false,
        },
      ],
      'perfectionist/sort-objects': ['warn', sorting],
      'perfectionist/sort-interfaces': ['warn', sorting],
      'perfectionist/sort-object-types': ['warn', sorting],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
    rules: {
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true, extraHOCs: ['observer'] },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^\\.\\./',
              message: 'Используйте @/ вместо импорта через ../. Импорты ./ разрешены.',
            },
          ],
        },
      ],
    },
  },
  { files: ['vite.config.ts'], languageOptions: { globals: globals.node } },
  prettier,
])
