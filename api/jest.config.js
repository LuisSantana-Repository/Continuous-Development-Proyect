// jest.config.js
export default {
  testEnvironment: 'node',
  
  // Transform settings for ES modules
  transform: {},
  
  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  
  // Setup files
  setupFiles: ['<rootDir>/tests/setup.js'],
  
  // Module name mapper for ES modules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/**/*.test.js'
  ],
  
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/'
  ],
  
  // Increase timeout for async operations
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true
};