/**
 * Centralized LLM Configuration
 *
 * Single source of truth for all LLM service configurations across the application.
 * Each service has its own optimized settings for model, temperature, tokens, etc.
 */

import { LLMServiceConfig } from "@/lib/services/llm/types";

export interface ServiceConfig extends LLMServiceConfig {
  description: string;
}

/**
 * Centralized LLM configurations for all services
 */
export const LLM_SERVICE_CONFIGS: Record<string, ServiceConfig> = {
  conceptExtraction: {
    description: 'AI-powered concept extraction from Polish course content',
    apiKey: '', // Will be set from environment
    model: 'gpt-4.1-nano',
    temperature: 0.3, // Lower for consistent extractions
    maxTokens: 6000, // High limit for complex course content (legacy)
    max_completion_tokens: 6000, // New parameter for newer models
    timeout: 45000, // Longer timeout for complex processing
    maxRetries: 3,
    retryDelay: 1500,
  },

  questionGeneration: {
    description: 'Intelligent question generation for practice sessions',
    apiKey: '', // Will be set from environment
    model: 'gpt-4.1-nano',
    temperature: 0.7, // Balanced creativity for varied questions
    maxTokens: 2000, // Moderate limit for question content (legacy)
    max_completion_tokens: 2000, // New parameter for newer models
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
  },

  audioGeneration: {
    description: 'Text-to-speech audio generation for questions',
    apiKey: '', // Will be set from environment
    model: 'gpt-4o-mini', // Lighter model for audio content preparation
    temperature: 0.7,
    maxTokens: 500, // Limited tokens for audio content (legacy)
    max_completion_tokens: 500, // New parameter for newer models
    timeout: 25000,
    maxRetries: 2,
    retryDelay: 1000,
  },

  imageGeneration: {
    description: 'DALL-E image generation for visual vocabulary questions',
    apiKey: '', // Will be set from environment
    model: 'dall-e-3', // Specific model for image generation
    temperature: 0.8, // Higher creativity for varied images
    maxTokens: 1000, // For image prompt preparation (legacy)
    max_completion_tokens: 1000, // New parameter for newer models
    timeout: 60000, // Longer timeout for image processing
    maxRetries: 2,
    retryDelay: 2000,
  },

  contentAnalysis: {
    description: 'Content analysis for media generation context',
    apiKey: '', // Will be set from environment
    model: 'gpt-4o-mini',
    temperature: 0.5, // Balanced for analytical tasks
    maxTokens: 1000, // Legacy parameter
    max_completion_tokens: 1000, // New parameter for newer models
    timeout: 20000,
    maxRetries: 2,
    retryDelay: 800,
  },

  textAnalysis: {
    description: 'General text analysis and processing',
    apiKey: '', // Will be set from environment
    model: 'gpt-4o-mini',
    temperature: 0.4, // Lower for consistent analysis
    maxTokens: 1500, // Legacy parameter
    max_completion_tokens: 1500, // New parameter for newer models
    timeout: 25000,
    maxRetries: 2,
    retryDelay: 1000,
  },

  // Default configuration for any unlisted services
  default: {
    description: 'Default configuration for general LLM usage',
    apiKey: '', // Will be set from environment
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 1000, // Legacy parameter
    max_completion_tokens: 1000, // New parameter for newer models
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
  }
};

/**
 * Get configuration for a specific service
 */
export function getServiceConfig(serviceName: string): LLMServiceConfig {
  const config = LLM_SERVICE_CONFIGS[serviceName] || LLM_SERVICE_CONFIGS.default;

  // Set API key from environment
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  return {
    ...config,
    apiKey,
  };
}

/**
 * Get all available service names
 */
export function getAvailableServices(): string[] {
  return Object.keys(LLM_SERVICE_CONFIGS);
}

/**
 * Validate that required environment variables are present
 */
export function validateEnvironment(): { isValid: boolean; error?: string } {
  if (!process.env.OPENAI_API_KEY) {
    return {
      isValid: false,
      error: 'OPENAI_API_KEY environment variable is not set'
    };
  }

  return { isValid: true };
}