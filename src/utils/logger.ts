import winston from 'winston';
import { config } from '../config/config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const customFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const transports: winston.transport[] = [];

if (config.logging.console) {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      ),
    })
  );
}

if (config.logging.file.enabled) {
  transports.push(
    new winston.transports.File({
      filename: `${config.logging.file.path}/bot.log`,
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      ),
      maxFiles: config.logging.file.maxFiles,
      maxsize: parseInt(config.logging.file.maxSize) * 1024 * 1024,
    })
  );
}

export const logger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: { service: 'utility-bot' },
  transports,
  exceptionHandlers: transports,
  rejectionHandlers: transports,
});

export default logger;
