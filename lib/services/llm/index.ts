/**
 * LLM Services - Centralized LLM service management
 * 
 * This module provides a unified interface for all LLM service providers
 * with consistent error handling, retry logic, and metrics tracking.
 */

// Core services
export { BaseLLMService } from './baseLLMService';
export { OpenAIService } from './openAIService';
export { GroqService } from './groqService';
export { LLMServiceFactory } from './llmServiceFactory';

// Types
export type {
  LLMRequest,
  LLMResponse,
  LLMServiceConfig,
  RetryConfig,
  ParsedLLMResponse,
  LLMServiceMetrics,
} from './types';

// Enums
export { LLMProvider } from './types';

// Convenience exports for common usage patterns
export const createOpenAIService = (config?: Partial<import('./types').LLMServiceConfig>) => 
  import('./llmServiceFactory').then(({ LLMServiceFactory }) => LLMServiceFactory.getOpenAIService(config));

export const createGroqService = (config?: Partial<import('./types').LLMServiceConfig>) => 
  import('./llmServiceFactory').then(({ LLMServiceFactory }) => LLMServiceFactory.getGroqService(config));

export const getAvailableLLMService = (preferredProvider?: import('./types').LLMProvider) => 
  import('./llmServiceFactory').then(({ LLMServiceFactory }) => LLMServiceFactory.getAvailableService(preferredProvider));

export const getLLMService = (provider: import('./types').LLMProvider, config?: Partial<import('./types').LLMServiceConfig>) => 
  import('./llmServiceFactory').then(({ LLMServiceFactory }) => LLMServiceFactory.getService(provider, config));

/**
 * Quick access to commonly used LLM services
 */
export const LLMServices = {
  openai: () => createOpenAIService(),
  groq: () => createGroqService(),
  auto: () => getAvailableLLMService(),
  factory: () => import('./llmServiceFactory').then(({ LLMServiceFactory }) => LLMServiceFactory),
} as const;