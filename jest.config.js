export default {
  runner: 'jest-light-runner',
  setupFilesAfterEnv: [
    '<rootDir>/test-config.js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/packages/',
    '/templates/',
    '/tmp/',
  ],
  collectCoverageFrom: ['src/**/*.js'],
};
