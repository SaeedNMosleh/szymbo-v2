/**
 * Type definitions for LLM service implementations
 */

export interface LLMRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LLMResponse<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  confidence?: number;
  metadata?: {
    provider: string;
    model: string;
    tokensUsed?: number;
    duration?: number;
    retryCount?: number;
  };
}

export interface LLMServiceConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;
}

export enum LLMProvider {
  OPENAI = 'openai',
  GROQ = 'groq',
}

export interface ParsedLLMResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  confidence?: number;
  rawResponse?: string;
}

export interface LLMServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalTokensUsed: number;
}