/**
 * Standardized error classes and utilities for consistent error handling
 * across the Szymbo V2 application.
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

/**
 * Database operation error
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: unknown) {
    super(message, 'DATABASE_ERROR', 500, context);
    this.name = 'DatabaseError';
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: unknown) {
    super(message, 'AUTHENTICATION_ERROR', 401, context);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: unknown) {
    super(message, 'AUTHORIZATION_ERROR', 403, context);
    this.name = 'AuthorizationError';
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: unknown) {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404, context);
    this.name = 'NotFoundError';
  }
}

/**
 * LLM service error
 */
export class LLMServiceError extends AppError {
  constructor(message: string, context?: unknown) {
    super(message, 'LLM_SERVICE_ERROR', 500, context);
    this.name = 'LLMServiceError';
  }
}

/**
 * Concept extraction error
 */
export class ConceptExtractionError extends AppError {
  constructor(message: string, context?: unknown) {
    super(message, 'CONCEPT_EXTRACTION_ERROR', 500, context);
    this.name = 'ConceptExtractionError';
  }
}

/**
 * Concept validation error
 */
export class ConceptValidationError extends AppError {
  constructor(message: string, context?: unknown) {
    super(message, 'CONCEPT_VALIDATION_ERROR', 400, context);
    this.name = 'ConceptValidationError';
  }
}

/**
 * Practice engine error
 */
export class PracticeEngineError extends AppError {
  constructor(message: string, context?: unknown) {
    super(message, 'PRACTICE_ENGINE_ERROR', 500, context);
    this.name = 'PracticeEngineError';
  }
}

/**
 * Error handler utility for consistent error processing
 */
export class ErrorHandler {
  /**
   * Process error and return standardized error information
   */
  static processError(error: unknown): {
    message: string;
    code: string;
    statusCode: number;
    context?: unknown;
  } {
    if (error instanceof AppError) {
      return {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        context: error.context,
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'UNKNOWN_ERROR',
        statusCode: 500,
        context: { stack: error.stack },
      };
    }

    return {
      message: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
      context: { originalError: error },
    };
  }

  /**
   * Check if error is a specific type of AppError
   */
  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }

  /**
   * Check if error is a validation error
   */
  static isValidationError(error: unknown): error is ValidationError {
    return error instanceof ValidationError;
  }

  /**
   * Check if error is a database error
   */
  static isDatabaseError(error: unknown): error is DatabaseError {
    return error instanceof DatabaseError;
  }

  /**
   * Check if error is a not found error
   */
  static isNotFoundError(error: unknown): error is NotFoundError {
    return error instanceof NotFoundError;
  }
}

/**
 * Error context builder for consistent error reporting
 */
export class ErrorContextBuilder {
  private context: Record<string, unknown> = {};

  /**
   * Add user context
   */
  addUser(userId: string): this {
    this.context.userId = userId;
    return this;
  }

  /**
   * Add request context
   */
  addRequest(method: string, url: string, body?: any): this {
    this.context.request = { method, url, body };
    return this;
  }

  /**
   * Add database context
   */
  addDatabase(operation: string, collection?: string, query?: any): this {
    this.context.database = { operation, collection, query };
    return this;
  }

  /**
   * Add LLM service context
   */
  addLLMService(provider: string, model?: string, prompt?: string): this {
    this.context.llmService = { provider, model, prompt };
    return this;
  }

  /**
   * Add custom context
   */
  addCustom(key: string, value: unknown): this {
    this.context[key] = value;
    return this;
  }

  /**
   * Build the context object
   */
  build(): Record<string, unknown> {
    return { ...this.context };
  }
}