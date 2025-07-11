/**
 * Centralized logging utility for consistent logging across the application
 */

// Using string literals instead of enum values to avoid unused enum values warnings
export type LogLevel = "error" | "warn" | "info" | "debug";

// Using a namespace to avoid unused variable warnings
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LOG_LEVELS {
  export const ERROR: LogLevel = "error";
  export const WARN: LogLevel = "warn";
  export const INFO: LogLevel = "info";
  export const DEBUG: LogLevel = "debug";
}

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  operation?: string;
  duration?: number;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private logLevel = process.env.LOG_LEVEL || "info";

  /**
   * Log an error message with context
   */
  error(message: string, context?: LogContext | Error): void {
    this.log(LOG_LEVELS.ERROR, message, context, "❌");
  }

  /**
   * Log a warning message with context
   */
  warn(message: string, context?: LogContext): void {
    this.log(LOG_LEVELS.WARN, message, context, "⚠️");
  }

  /**
   * Log an info message with context
   */
  info(message: string, context?: LogContext): void {
    this.log(LOG_LEVELS.INFO, message, context, "ℹ️");
  }

  /**
   * Log a debug message with context
   */
  debug(message: string, context?: LogContext): void {
    this.log(LOG_LEVELS.DEBUG, message, context, "🔍");
  }

  /**
   * Log a success message with context
   */
  success(message: string, context?: LogContext): void {
    this.log(LOG_LEVELS.INFO, message, context, "✅");
  }

  /**
   * Log API request start
   */
  apiStart(method: string, url: string, userId?: string): void {
    this.info(`API Request: ${method} ${url}`, {
      operation: "api_request_start",
      method,
      url,
      userId,
    });
  }

  /**
   * Log API request completion
   */
  apiComplete(
    method: string,
    url: string,
    status: number,
    duration: number,
    userId?: string
  ): void {
    const level = status >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;
    const icon = status >= 400 ? "❌" : "✅";

    this.log(
      level,
      `API Complete: ${method} ${url} - ${status} (${duration}ms)`,
      {
        operation: "api_request_complete",
        method,
        url,
        status,
        duration,
        userId,
      },
      icon
    );
  }

  /**
   * Log database operation
   */
  database(
    operation: string,
    collection: string,
    duration?: number,
    context?: LogContext
  ): void {
    this.debug(
      `Database: ${operation} on ${collection}${duration ? ` (${duration}ms)` : ""}`,
      {
        operation: "database_operation",
        dbOperation: operation,
        collection,
        duration,
        ...context,
      }
    );
  }

  /**
   * Log LLM service operation
   */
  llmService(
    provider: string,
    operation: string,
    duration?: number,
    context?: LogContext
  ): void {
    this.info(
      `LLM Service: ${provider} - ${operation}${duration ? ` (${duration}ms)` : ""}`,
      {
        operation: "llm_service_operation",
        provider,
        llmOperation: operation,
        duration,
        ...context,
      }
    );
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 5000 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    const icon = duration > 5000 ? "⚠️" : "📊";

    this.log(
      level,
      `Performance: ${operation} took ${duration}ms`,
      {
        operation: "performance_metric",
        performanceOperation: operation,
        duration,
        ...context,
      },
      icon
    );
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext | Error,
    icon?: string
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = icon ? `${icon} ` : "";
    const levelPrefix = `[${level.toUpperCase()}]`;

    const logMessage = `${prefix}${levelPrefix} ${message}`;

    if (context) {
      if (context instanceof Error) {
        console[level](logMessage, {
          error: {
            message: context.message,
            stack: context.stack,
            name: context.name,
          },
          timestamp,
        });
      } else {
        console[level](logMessage, {
          ...context,
          timestamp,
        });
      }
    } else {
      console[level](logMessage, { timestamp });
    }
  }

  /**
   * Check if message should be logged based on log level
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment && level === LOG_LEVELS.DEBUG) {
      return false;
    }

    const levels = [
      LOG_LEVELS.ERROR,
      LOG_LEVELS.WARN,
      LOG_LEVELS.INFO,
      LOG_LEVELS.DEBUG,
    ];
    const currentLevelIndex = levels.indexOf(this.logLevel as LogLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex <= currentLevelIndex;
  }

  /**
   * Create a child logger with default context
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);

    childLogger.log = (
      level: LogLevel,
      message: string,
      context?: LogContext | Error,
      icon?: string
    ) => {
      const mergedContext =
        context instanceof Error ? context : { ...defaultContext, ...context };

      originalLog(level, message, mergedContext, icon);
    };

    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for creating child loggers
export { Logger };

// Helper function to create operation-specific loggers
export function createOperationLogger(
  operation: string,
  context?: LogContext
): Logger {
  return logger.child({ operation, ...context });
}

// Helper function to measure and log operation duration
export async function measureOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = Date.now();
  const operationLogger = createOperationLogger(operation, context);

  try {
    operationLogger.debug(`Starting ${operation}`);
    const result = await fn();
    const duration = Date.now() - start;
    operationLogger.performance(operation, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    operationLogger.error(
      `${operation} failed after ${duration}ms`,
      error as Error
    );
    throw error;
  }
}
