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
      statements: 100,
      branches: 80,
      functions: 100,
      lines: 100,
    },
  },
};
