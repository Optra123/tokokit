module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true
  },
  extends: ['eslint:recommended', 'plugin:jest/recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['jest'],
  rules: {
    // Error prevention
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'warn',

    // Best practices
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'warn',

    // Security
    'no-prototype-builtins': 'error',

    // Code style (handled by Prettier mostly)
    quotes: ['error', 'single', { avoidEscape: true }],
    semi: ['error', 'always']
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
