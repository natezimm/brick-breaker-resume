module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'parser.js',
    'main.js'
  ],
  coverageThreshold: {
    global: {
      lines: 90,
      statements: 85,
      functions: 85,
      branches: 80,
    },
  },
};
