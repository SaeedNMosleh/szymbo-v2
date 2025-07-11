/**
 * Groq LLM service implementation
 */

import Groq from 'groq-sdk';
import { BaseLLMService } from './baseLLMService';
import { LLMServiceError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import type { LLMRequest, LLMServiceConfig, LLMProvider } from './types';

export class GroqService extends BaseLLMService {
  private client: Groq;
  private defaultModel = 'llama3-70b-8192';

  constructor(config: LLMServiceConfig) {
    super(config);
    this.validateConfig();
    
    this.client = new Groq({
      apiKey: this.config.apiKey,
    });

    if (config.model) {
      this.defaultModel = config.model;
    }
  }

  protected getProvider(): LLMProvider {
    return 'groq' as LLMProvider;
  }

  protected getDefaultModel(): string {
    return this.defaultModel;
  }

  protected async makeRequest(request: LLMRequest): Promise<string> {
    try {
      const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

      // Add system message if provided
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: request.prompt,
      });

      const completion = await this.client.chat.completions.create({
        model: request.model || this.getDefaultModel(),
        messages,
        temperature: request.temperature ?? this.config.temperature,
        max_tokens: request.maxTokens ?? this.config.maxTokens,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new LLMServiceError('No response received from Groq');
      }

      // Update token usage metrics
      if (completion.usage) {
        this.metrics.totalTokensUsed += completion.usage.total_tokens;
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Groq API error', {
          message: error.message,
          provider: this.getProvider(),
        });
        
        throw new LLMServiceError(
          `Groq API error: ${error.message}`,
          { provider: this.getProvider() }
        );
      }

      throw new LLMServiceError(
        'Unknown error occurred during Groq request',
        { provider: this.getProvider() }
      );
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const models = await this.client.models.list();
      return models.data
        .map(model => model.id)
        .sort();
    } catch (error) {
      logger.error('Failed to fetch Groq models', error as Error);
      return [this.defaultModel];
    }
  }

  /**
   * Generate completion with streaming
   */
  async generateStreamingResponse(
    request: LLMRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: request.prompt,
      });

      const stream = await this.client.chat.completions.create({
        model: request.model || this.getDefaultModel(),
        messages,
        temperature: request.temperature ?? this.config.temperature,
        max_tokens: request.maxTokens ?? this.config.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          onChunk(content);
        }
      }
    } catch (error) {
      logger.error('Streaming request failed', error as Error);
      throw new LLMServiceError(
        'Streaming request failed',
        { provider: this.getProvider() }
      );
    }
  }
}