/**
 * Centralized logging service for EcomIA
 * Handles console logs, error tracking, and optional remote logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

// Color codes for console output
const colors = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m', // green
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m',
};

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = this.isDevelopment ? `[${timestamp}]` : '';
    return `${prefix} [${level.toUpperCase()}] ${message}`;
  }

  private addToBuffer(entry: LogEntry): void {
    this.logs.push(entry);
    // Keep buffer size manageable
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      context,
    };
    this.addToBuffer(entry);

    if (this.isDevelopment) {
      console.log(`${colors.debug}${this.formatMessage('debug', message)}${colors.reset}`, context || '');
    }
  }

  info(message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    };
    this.addToBuffer(entry);

    console.log(`${colors.info}${this.formatMessage('info', message)}${colors.reset}`, context || '');
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
    };
    this.addToBuffer(entry);

    console.warn(`${colors.warn}${this.formatMessage('warn', message)}${colors.reset}`, context || '');
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context,
      error,
    };
    this.addToBuffer(entry);

    console.error(`${colors.error}${this.formatMessage('error', message)}${colors.reset}`, {
      error: error?.message,
      stack: error?.stack,
      context,
    });

    // Optional: Send to remote service (Sentry, etc.)
    this.sendToRemote(entry);
  }

  private sendToRemote(entry: LogEntry): void {
    // TODO: Implement Sentry or other remote logging service
    // Example:
    // if (entry.level === 'error' && process.env.SENTRY_DSN) {
    //   fetch(process.env.SENTRY_DSN, { method: 'POST', body: JSON.stringify(entry) });
    // }
  }

  /**
   * Get logs for debugging purposes
   * @param level Filter by log level (optional)
   * @param limit Limit number of results (default: 100)
   */
  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    let results = this.logs;
    if (level) {
      results = results.filter((log) => log.level === level);
    }
    return results.slice(-limit);
  }

  /**
   * Clear all logs from buffer
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
export const logger = new Logger();

/**
 * Generic error message formatter for user display
 */
export function getErrorMessage(error: unknown, context: string = ''): string {
  if (error instanceof Error) {
    // Known error patterns
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Error de conexión. Por favor, verifica tu internet.';
    }
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
    }
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'No tienes permiso para realizar esta acción.';
    }
    if (error.message.includes('404') || error.message.includes('not found')) {
      return 'El recurso solicitado no existe.';
    }
    if (error.message.includes('429')) {
      return 'Demasiadas solicitudes. Por favor, intenta más tarde.';
    }
    if (error.message.includes('500') || error.message.includes('server')) {
      return 'Error del servidor. Por favor, intenta nuevamente.';
    }
    return error.message || 'Error desconocido';
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Algo salió mal. Por favor, intenta nuevamente.';
}

/**
 * Async function wrapper with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
  }
): Promise<T> {
  const maxAttempts = options?.maxAttempts || 3;
  const baseDelay = options?.delay || 1000;
  const useBackoff = options?.backoff !== false;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      logger.warn(`Attempt ${attempt}/${maxAttempts} failed`, {
        error: lastError.message,
      });

      // Don't retry on auth errors
      if (lastError.message.includes('401') || lastError.message.includes('403')) {
        throw lastError;
      }

      if (attempt < maxAttempts) {
        const delay = useBackoff ? baseDelay * Math.pow(2, attempt - 1) : baseDelay;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retry attempts reached');
}

export default logger;
