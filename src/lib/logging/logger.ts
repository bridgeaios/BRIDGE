import pino from 'pino';
import pinoPretty from 'pino-pretty';

const isDevelopment = process.env.NODE_ENV !== 'production';
const isEdge = typeof navigator !== 'undefined' || (typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis);

let logger: pino.Logger;

if (isEdge) {
  logger = pino({
    level: isDevelopment ? 'debug' : 'info',
    base: { service: 'bridge-frontier' },
  });
} else {
  logger = pino(
    isDevelopment
      ? {
          level: 'debug',
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
        }
      : {
          level: 'info',
          formatters: {
            level: (label) => ({ level: label }),
          },
        },
    {
      base: { service: 'bridge-frontier', env: process.env.NODE_ENV },
    }
  );
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  module?: string;
  action?: string;
  [key: string]: any;
}

export function createChildLogger(context: LogContext): pino.Logger {
  return logger.child(context);
}

export function logApiRequest(
  logger: pino.Logger,
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  context?: LogContext
) {
  logger.info(
    {
      method,
      path,
      statusCode,
      durationMs,
      ...context,
    },
    `${method} ${path} ${statusCode} (${durationMs}ms)`
  );
}

export function logError(
  logger: pino.Logger,
  error: Error | unknown,
  context?: LogContext
) {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      ...context,
    },
    err.message
  );
}

export function logSecurityEvent(
  logger: pino.Logger,
  event: 'auth_failure' | 'rate_limit' | 'csrf_failure' | 'xss_attempt' | 'suspicious_activity',
  context: LogContext & { ip?: string; userAgent?: string }
) {
  logger.warn(
    {
      securityEvent: event,
      ...context,
    },
    `Security event: ${event}`
  );
}

export { logger };
export default logger;