module.exports = {
  plugins: ['security', 'sonarjs', 'node'],
  extends: [
    'plugin:security/recommended',
    'plugin:sonarjs/recommended',
    'plugin:node/recommended'
  ],
  rules: {
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-object-injection': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-unsafe-regex': 'error',
    'sonarjs/cognitive-complexity': ['error', 15],
    'sonarjs/max-switch-cases': ['error', 10],
    'sonarjs/no-duplicate-string': ['error', 5],
    'sonarjs/no-nested-template-literals': 'error',
    'node/no-deprecated-api': 'error',
    'node/no-missing-require': 'error',
    'node/no-unpublished-require': 'off',
    'node/no-unsupported-features/es-syntax': ['error', {
      version: '>=20.0.0',
      ignores: []
    }]
  }
};