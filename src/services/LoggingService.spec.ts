import { LoggingService } from './LoggingService';

describe('LoggingService', () => {
  let loggingService: LoggingService;

  beforeEach(() => {
    loggingService = new LoggingService();
  });

  it('should log info messages', () => {
    const message = 'This is an info message';
    const meta = { user: 'John Doe' };
    const spy = jest.spyOn(loggingService, 'info');

    loggingService.info(message, meta);

    expect(spy).toHaveBeenCalledWith(message, meta);
  });

  it('should log error messages', () => {
    const spy = jest.spyOn(loggingService['logger'], 'error');
    const message = 'This is an error message';
    const error = new Error('Some error');

    loggingService.error(message, error);

    expect(spy).toHaveBeenCalledWith(message, {
      error: error,
      message: error.message,
      stack: error.stack,
    });
  });

  it('should log warning messages', () => {
    const message = 'This is a warning message';
    const meta = { user: 'Jane Smith' };
    const spy = jest.spyOn(loggingService, 'warn');

    loggingService.warn(message, meta);

    expect(spy).toHaveBeenCalledWith(message, meta);
  });

  it('should log debug messages', () => {
    const message = 'This is a debug message';
    const meta = { user: 'Alice Johnson' };
    const spy = jest.spyOn(loggingService, 'debug');

    loggingService.debug(message, meta);

    expect(spy).toHaveBeenCalledWith(message, meta);
  });
});
