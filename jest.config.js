// Set up test environment to be Node.js
module.exports = {
  testEnvironment: 'node',
  // Collect code coverage information during test runs
  collectCoverage: true,
  // Set the directory where coverage reports will be stored
  coverageDirectory: './coverage',
  // Specify which files to collect coverage data from (ignore node_modules and the Jest config file)
  collectCoverageFrom: ['**/*.js', '!**/node_modules/**', '!**/jest.config.js'],
  // Set the coverage report format to text and HTML
  coverageReporters: ['text', 'html'],
  // Use the default Jest test runner reporter
  reporters: ['default'],
  // Set the file pattern to match for test files
  testMatch: ['**/__tests__/**/*.test.js', '**/__tests__/**/*.spec.js'],
  // Display detailed information during test runs
  verbose: true,
};
