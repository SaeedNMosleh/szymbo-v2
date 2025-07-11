/**
 * Standardized API response utilities for consistent response formatting
 * across all API routes in the Szymbo V2 application.
 */

import { NextResponse } from 'next/server';

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  timestamp: string;
  pagination?: PaginationMeta;
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  pagination?: PaginationMeta
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: unknown
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  if (details) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(
  error: string,
  validationErrors: unknown
): NextResponse<ApiResponse> {
  return createErrorResponse(
    error,
    400,
    { validationErrors }
  );
}

/**
 * Create a not found error response
 */
export function createNotFoundResponse(
  resource: string = 'Resource'
): NextResponse<ApiResponse> {
  return createErrorResponse(
    `${resource} not found`,
    404
  );
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const pages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}

/**
 * Helper to handle async operations with standardized error responses
 */
export async function handleApiRequest<T>(
  operation: () => Promise<T>,
  successStatus: number = 200,
  pagination?: PaginationMeta
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const data = await operation();
    return createSuccessResponse(data, successStatus, pagination);
  } catch (error) {
    console.error('API request failed:', error);
    
    if (error instanceof Error) {
      return createErrorResponse(
        'Internal server error',
        500,
        { message: error.message }
      ) as NextResponse<ApiResponse<T>>;
    }
    
    return createErrorResponse('Unknown error occurred', 500) as NextResponse<ApiResponse<T>>;
  }
}