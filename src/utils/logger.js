// src/utils/logger.js
import fs from 'fs';
import path from 'path';
import winston from 'winston';

// Ensure logs directory exists
const logDir = path.resolve('logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const isProduction = process.env.NODE_ENV === 'production';

// Common format for all loggers
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

// Application logger
const appLogger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: isProduction ? productionFormat : developmentFormat,
  transports: [
    new winston.transports.Console(),
    ...(isProduction ? [
      new winston.transports.File({ filename: path.join(logDir, 'app.log') })
    ] : [])
  ]
});

// Server logger for bin/www and server lifecycle events
const serverLogger = winston.createLogger({
  level: 'info',
  format: isProduction ? productionFormat : developmentFormat,
  transports: [
    new winston.transports.Console(),
    ...(isProduction ? [
      new winston.transports.File({ filename: path.join(logDir, 'server.log') })
    ] : [])
  ]
});

// HTTP access logger
const accessLogger = winston.createLogger({
  level: 'info',
  format: productionFormat,
  transports: [
    ...(isProduction ? [
      new winston.transports.File({ filename: path.join(logDir, 'access.log') })
    ] : [])
  ],
  silent: !isProduction // Only active in production
});

// Create a stream for Morgan to use
const morganStream = {
  write: (message) => {
    // Remove trailing newline
    accessLogger.info(message.trim());
  }
};

export { accessLogger, serverLogger, morganStream };
export default appLogger;
