/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: [
    '<rootDir>/control-center/tests',
    '<rootDir>/api-gateway/tests',
    '<rootDir>/internal-modules/*/tests'
  ],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  },
  moduleNameMapper: {
    '^@control-center/(.*)$': '<rootDir>/control-center/$1',
    '^@api-gateway/(.*)$': '<rootDir>/api-gateway/$1',
    '^@internal-modules/(.*)$': '<rootDir>/internal-modules/$1',
    '^@external-modules/(.*)$': '<rootDir>/external-modules/$1'
  }
};
