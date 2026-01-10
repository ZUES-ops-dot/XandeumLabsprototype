export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

function formatError(err: unknown): LogEntry['error'] | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack
    };
  }
  return {
    name: 'UnknownError',
    message: String(err)
  };
}

export class Logger {
  private service: string;
  private minLevel: LogLevel;
  private json: boolean;

  constructor(options: { service: string; level?: LogLevel; json?: boolean }) {
    this.service = options.service;
    this.minLevel = options.level ?? 'info';
    this.json = options.json ?? process.env.NODE_ENV === 'production';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatMessage(entry: LogEntry): string {
    if (this.json) {
      return JSON.stringify(entry);
    }

    const time = entry.timestamp.split('T')[1]?.slice(0, 8) ?? entry.timestamp;
    const levelStr = entry.level.toUpperCase().padEnd(5);
    const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const errStr = entry.error ? ` | ${entry.error.name}: ${entry.error.message}` : '';

    return `${time} [${levelStr}] [${entry.service}] ${entry.message}${ctx}${errStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: unknown): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      context,
      error: formatError(error)
    };

    const formatted = this.formatMessage(entry);

    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext, error?: unknown): void {
    this.log('warn', message, context, error);
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  child(context: LogContext): Logger {
    const child = new Logger({
      service: this.service,
      level: this.minLevel,
      json: this.json
    });
    return child;
  }
}

const loggers = new Map<string, Logger>();

export function createLogger(service: string, options?: { level?: LogLevel; json?: boolean }): Logger {
  const existing = loggers.get(service);
  if (existing) return existing;

  const logger = new Logger({ service, ...options });
  loggers.set(service, logger);
  return logger;
}
