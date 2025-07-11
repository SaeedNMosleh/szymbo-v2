/**
 * Base LLM service providing common functionality for all LLM providers
 */

import { logger } from '@/lib/utils/logger';
import { LLMServiceError } from '@/lib/utils/errors';
import type {
  LLMRequest,
  LLMResponse,
  LLMServiceConfig,
  RetryConfig,
  LLMProvider,
  ParsedLLMResponse,
  LLMServiceMetrics,
} from './types';

export abstract class BaseLLMService {
  protected config: LLMServiceConfig;
  protected retryConfig: RetryConfig;
  protected metrics: LLMServiceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    totalTokensUsed: 0,
  };

  constructor(config: LLMServiceConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      temperature: 0.7,
      maxTokens: 1000,
      ...config,
    };

    this.retryConfig = {
      maxRetries: this.config.maxRetries || 3,
      retryDelay: this.config.retryDelay || 1000,
      backoffMultiplier: 2,
      maxRetryDelay: 10000,
    };
  }

  /**
   * Abstract method to be implemented by each provider
   */
  protected abstract makeRequest(request: LLMRequest): Promise<string>;

  /**
   * Abstract method to get provider name
   */
  protected abstract getProvider(): LLMProvider;

  /**
   * Abstract method to get default model
   */
  protected abstract getDefaultModel(): string;

  /**
   * Make LLM request with retry logic and error handling
   */
  async generateResponse<T = string>(
    request: LLMRequest,
    parser?: (response: string) => T
  ): Promise<LLMResponse<T>> {
    const startTime = Date.now();
    let retryCount = 0;
    let lastError: Error | null = null;

    this.metrics.totalRequests++;

    while (retryCount <= this.retryConfig.maxRetries) {
      try {
        logger.debug(`LLM request attempt ${retryCount + 1}`, {
          provider: this.getProvider(),
          model: request.model || this.getDefaultModel(),
          retryCount,
        });

        const rawResponse = await this.makeRequestWithTimeout(request);
        const duration = Date.now() - startTime;

        // Update metrics
        this.metrics.successfulRequests++;
        this.updateAverageResponseTime(duration);

        // Parse response if parser is provided
        const data = parser ? parser(rawResponse) : (rawResponse as T);

        logger.llmService(
          this.getProvider(),
          'generate_response',
          duration,
          {
            model: request.model || this.getDefaultModel(),
            retryCount,
            success: true,
          }
        );

        return {
          success: true,
          data,
          metadata: {
            provider: this.getProvider(),
            model: request.model || this.getDefaultModel(),
            duration,
            retryCount,
          },
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        retryCount++;

        logger.warn(`LLM request failed, attempt ${retryCount}`, {
          provider: this.getProvider(),
          error: lastError.message,
          retryCount,
        });

        // If we haven't exceeded max retries, wait before retrying
        if (retryCount <= this.retryConfig.maxRetries) {
          const delay = this.calculateRetryDelay(retryCount);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    const duration = Date.now() - startTime;
    this.metrics.failedRequests++;

    logger.error(`LLM request failed after ${retryCount} attempts`, {
      provider: this.getProvider(),
      error: lastError?.message,
      duration,
    });

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      metadata: {
        provider: this.getProvider(),
        model: request.model || this.getDefaultModel(),
        duration,
        retryCount: retryCount - 1,
      },
    };
  }

  /**
   * Make request with timeout
   */
  private async makeRequestWithTimeout(request: LLMRequest): Promise<string> {
    const timeout = this.config.timeout || 30000;
    
    return Promise.race([
      this.makeRequest(request),
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${timeout}ms`));
        }, timeout);
      }),
    ]);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = this.retryConfig.retryDelay;
    const multiplier = Math.pow(this.retryConfig.backoffMultiplier, retryCount - 1);
    const delay = baseDelay * multiplier;
    
    return Math.min(delay, this.retryConfig.maxRetryDelay);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update average response time metric
   */
  private updateAverageResponseTime(duration: number): void {
    const totalTime = this.metrics.averageResponseTime * this.metrics.successfulRequests;
    this.metrics.averageResponseTime = (totalTime + duration) / (this.metrics.successfulRequests + 1);
  }

  /**
   * Get service metrics
   */
  getMetrics(): LLMServiceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalTokensUsed: 0,
    };
  }

  /**
   * Build system prompt with template variables
   */
  protected buildSystemPrompt(template: string, variables: Record<string, unknown>): string {
    let prompt = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return prompt;
  }

  /**
   * Parse JSON response with error handling
   */
  protected parseJsonResponse<T>(response: string): ParsedLLMResponse<T> {
    try {
      // Try to extract JSON from response if it's wrapped in markdown or other text
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response.trim();

      const data = JSON.parse(jsonString);
      
      return {
        success: true,
        data,
        rawResponse: response,
      };
    } catch (error) {
      logger.warn('Failed to parse JSON response', {
        error: error instanceof Error ? error.message : 'Unknown error',
        response: response.substring(0, 200),
      });

      return {
        success: false,
        error: 'Failed to parse JSON response',
        rawResponse: response,
      };
    }
  }

  /**
   * Validate required configuration
   */
  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new LLMServiceError(
        `API key is required for ${this.getProvider()} service`,
        { provider: this.getProvider() }
      );
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.generateResponse({
        prompt: 'Say "OK" if you can read this.',
        model: this.getDefaultModel(),
        temperature: 0,
        maxTokens: 10,
      });

      return Boolean(response.success && response.data?.toString().toLowerCase().includes('ok'));
    } catch (error) {
      logger.error('Health check failed', error as Error);
      return false;
    }
  }
}