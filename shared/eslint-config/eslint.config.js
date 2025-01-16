import checkFile from 'eslint-plugin-check-file';
import tseslint from 'typescript-eslint';

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ['node_modules/*', 'dist/*', '.turbo/*', 'tests/*', 'bin/*', 'coverage/*'],
  },
  {
    plugins: {
      'check-file': checkFile,
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    files: ['src/**/*.ts'],
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'check-file/folder-naming-convention': [
        'error',
        {
          'src/**/': 'KEBAB_CASE',
          'tests/**/': 'KEBAB_CASE',
        },
      ],
    },
  },
];
