import winston from 'winston';

let logger: winston.Logger;

function createLogger() {
  // Lazy load config to avoid circular dependencies
  const config = require('../config').default;

  const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  logger = winston.createLogger({
    level: config.isDevelopment ? 'debug' : 'info',
    format: logFormat,
    defaultMeta: { service: 'loadlog-api' },
    transports: [
      // Write all logs with importance level of `error` or less to `error.log`
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      // Write all logs with importance level of `info` or less to `combined.log`
      new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
  });

  // If we're not in production then log to the console with a simple format
  if (config.isDevelopment) {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      })
    );
  }

  return logger;
}

// Export a getter that creates the logger on first access
const defaultLogger = createLogger();

export default defaultLogger;
