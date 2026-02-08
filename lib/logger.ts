const isDev = process.env.NODE_ENV === 'development';

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

function createLogger(level: LogLevel) {
  return (...args: unknown[]) => {
    if (isDev) {
      console[level](...args);
    }
  };
}

export const logger = {
  log: createLogger('log'),
  warn: createLogger('warn'),
  error: createLogger('error'),
  info: createLogger('info'),
  debug: createLogger('debug'),
};

// For errors that should always be logged (even in production)
export const logError = (...args: unknown[]) => {
  console.error(...args);
};

// Extract error message from unknown error type
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
