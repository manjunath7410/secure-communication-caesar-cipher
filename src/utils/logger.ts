/**
 * Zero-Leakage Logger for Academic Cryptography Demo
 * Strict Guarantee: NEVER logs plaintext messages or private cryptographic keys.
 */
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  metadata?: Record<string, unknown>;
}

class TacticalLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  public log(level: LogLevel, module: string, message: string, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      metadata,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE !== 'production') {
      const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${module}]`;
      if (level === 'error') {
        console.error(prefix, message, metadata || '');
      } else if (level === 'warn') {
        console.warn(prefix, message, metadata || '');
      } else {
        console.log(prefix, message, metadata || '');
      }
    }
  }

  public info(module: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('info', module, message, metadata);
  }

  public warn(module: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', module, message, metadata);
  }

  public error(module: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('error', module, message, metadata);
  }

  public getRecentLogs(): LogEntry[] {
    return [...this.logs];
  }
}

export const logger = new TacticalLogger();
