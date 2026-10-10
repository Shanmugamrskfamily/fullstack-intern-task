import { pino } from 'pino';
import { env } from '../config/env.js';

const defaultLevel = env.isTest ? 'silent' : env.isProduction ? 'info' : 'debug';

export const logger = pino({
  level: env.LOG_LEVEL ?? defaultLevel,
  // Secrets never reach the logs.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'password_hash',
      '*.password_hash',
    ],
    censor: '[redacted]',
  },
  ...(env.isProduction || env.isTest
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
      }),
});
