import winston from 'winston';
import { Logger } from '../types/Logger';

export class LoggingService implements Logger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      format: winston.format.simple(),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    });
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, { meta });
  }

  error(message: string, error?: any): void {
    if (error instanceof Error) {
      this.logger.error(message, {
        error,
        message: error.message,
        stack: error.stack,
      });
    } else {
      this.logger.error(message, { error });
    }
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, { meta });
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, { meta });
  }
}
