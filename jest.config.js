module.exports = {
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  // only match tests in src/ to avoid running tests in e2e/
  testRegex: 'src/.*(\\.|/)(test|spec)\\.[jt]sx?$',
}
