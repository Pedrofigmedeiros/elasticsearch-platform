import { Logger } from '@nestjs/common';

// Silence NestJS Logger output during tests to keep the test report clean.
// Assertions on logger calls (if needed) should mock the injected logger
// directly, not rely on this global suppression.
beforeAll(() => {
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'verbose').mockImplementation(() => undefined);
});

afterAll(() => {
  jest.restoreAllMocks();
});
