module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    'no-console': 'error',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        // ignore function arguments and variables that are explicitly ignored with a "_" prefix
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-empty-function': 'off',
    // Seems broken with TS sum types
    'react/prop-types': 'off',
    // We're all grown-ups here
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    // This is annoying as hell
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
}
