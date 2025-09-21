module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/database-tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'database-tests/**/*.ts',
    '!database-tests/**/*.d.ts',
    '!database-tests/**/*.test.ts',
    '!database-tests/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/database-tests/setup.ts'],
  testTimeout: 30000,
};