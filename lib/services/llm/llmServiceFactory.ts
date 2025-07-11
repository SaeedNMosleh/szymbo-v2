/**
 * LLM Service Factory for creating and managing LLM service instances
 */

import { OpenAIService } from "./openAIService";
import { GroqService } from "./groqService";
import { LLMServiceError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { type LLMProvider, type LLMServiceConfig } from "./types";
import type { BaseLLMService } from "./baseLLMService";

export class LLMServiceFactory {
  private static instances: Map<string, BaseLLMService> = new Map();

  /**
   * Create or get cached LLM service instance
   */
  static getService(
    provider: LLMProvider,
    config?: Partial<LLMServiceConfig>
  ): BaseLLMService {
    const instanceKey = `${provider}_${JSON.stringify(config || {})}`;

    if (this.instances.has(instanceKey)) {
      return this.instances.get(instanceKey)!;
    }

    const service = this.createService(provider, config);
    this.instances.set(instanceKey, service);

    return service;
  }

  /**
   * Create new LLM service instance
   */
  static createService(
    provider: LLMProvider,
    config?: Partial<LLMServiceConfig>
  ): BaseLLMService {
    const finalConfig = this.buildConfig(provider, config);

    switch (provider) {
      case "openai":
        return new OpenAIService(finalConfig);
      case "groq":
        return new GroqService(finalConfig);
      default:
        throw new LLMServiceError(`Unsupported LLM provider: ${provider}`, {
          provider,
        });
    }
  }

  /**
   * Get OpenAI service with default configuration
   */
  static getOpenAIService(config?: Partial<LLMServiceConfig>): OpenAIService {
    return this.getService("openai", config) as OpenAIService;
  }

  /**
   * Get Groq service with default configuration
   */
  static getGroqService(config?: Partial<LLMServiceConfig>): GroqService {
    return this.getService("groq", config) as GroqService;
  }

  /**
   * Build configuration with environment variables and defaults
   */
  private static buildConfig(
    provider: LLMProvider,
    config?: Partial<LLMServiceConfig>
  ): LLMServiceConfig {
    const baseConfig: LLMServiceConfig = {
      apiKey: this.getApiKey(provider),
      temperature: 0.7,
      maxTokens: 1000,
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    // Set default model based on provider
    if (!baseConfig.model) {
      baseConfig.model = this.getDefaultModel(provider);
    }

    return baseConfig;
  }

  /**
   * Get API key from environment variables
   */
  private static getApiKey(provider: LLMProvider): string {
    let apiKey: string | undefined;

    switch (provider) {
      case "openai":
        apiKey = process.env.OPENAI_API_KEY;
        break;
      case "groq":
        apiKey = process.env.GROQ_API_KEY;
        break;
      default:
        throw new LLMServiceError(`Unsupported provider: ${provider}`, {
          provider,
        });
    }

    if (!apiKey) {
      throw new LLMServiceError(
        `API key not found for ${provider}. Please set the appropriate environment variable.`,
        { provider }
      );
    }

    return apiKey;
  }

  /**
   * Get default model for provider
   */
  private static getDefaultModel(provider: LLMProvider): string {
    switch (provider) {
      case "openai":
        return "gpt-3.5-turbo";
      case "groq":
        return "llama3-70b-8192";
      default:
        throw new LLMServiceError(
          `No default model defined for provider: ${provider}`,
          { provider }
        );
    }
  }

  /**
   * Get service with automatic provider selection based on availability
   */
  static async getAvailableService(
    preferredProvider?: LLMProvider
  ): Promise<BaseLLMService> {
    const allProviders = ["openai", "groq"] as LLMProvider[];
    const providers: LLMProvider[] = preferredProvider
      ? [
          preferredProvider,
          ...allProviders.filter((p) => p !== preferredProvider),
        ]
      : allProviders;

    for (const provider of providers) {
      try {
        const service = this.getService(provider);
        const isHealthy = await service.healthCheck();

        if (isHealthy) {
          logger.info(`Selected ${provider} as LLM provider`);
          return service;
        }
      } catch (error) {
        logger.warn(`Failed to initialize ${provider} service`, {
          provider,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    throw new LLMServiceError(
      "No LLM services are available. Please check your configuration and API keys.",
      { providers }
    );
  }

  /**
   * Clear all cached instances
   */
  static clearCache(): void {
    this.instances.clear();
  }

  /**
   * Get all cached instances
   */
  static getCachedInstances(): Map<string, BaseLLMService> {
    return new Map(this.instances);
  }

  /**
   * Get service metrics for all cached instances
   */
  static getAllMetrics(): Record<string, unknown> {
    const metrics: Record<string, unknown> = {};

    this.instances.forEach((service, key) => {
      metrics[key] = service.getMetrics();
    });

    return metrics;
  }
}
