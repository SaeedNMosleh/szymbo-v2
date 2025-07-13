/**
 * OpenAI LLM service implementation
 */

import OpenAI from 'openai';
import { BaseLLMService } from './baseLLMService';
import { LLMServiceError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import type { LLMRequest, LLMServiceConfig, LLMProvider } from './types';

export class OpenAIService extends BaseLLMService {
  private client: OpenAI;
  private defaultModel = 'gpt-4o';

  constructor(config: LLMServiceConfig) {
    super(config);
    this.validateConfig();
    
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
    });

    if (config.model) {
      this.defaultModel = config.model;
    }
  }

  protected getProvider(): LLMProvider {
    return 'openai' as LLMProvider;
  }

  protected getDefaultModel(): string {
    return this.defaultModel;
  }

  protected async makeRequest(request: LLMRequest): Promise<string> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

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
        throw new LLMServiceError('No response received from OpenAI');
      }

      // Update token usage metrics
      if (completion.usage) {
        this.metrics.totalTokensUsed += completion.usage.total_tokens;
      }

      return response;
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        logger.error('OpenAI API error', {
          status: error.status,
          message: error.message,
          type: error.type,
        });
        
        throw new LLMServiceError(
          `OpenAI API error: ${error.message}`,
          {
            status: error.status,
            type: error.type,
            provider: this.getProvider(),
          }
        );
      }

      if (error instanceof Error) {
        throw new LLMServiceError(
          `OpenAI request failed: ${error.message}`,
          { provider: this.getProvider() }
        );
      }

      throw new LLMServiceError(
        'Unknown error occurred during OpenAI request',
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
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id)
        .sort();
    } catch (error) {
      logger.error('Failed to fetch OpenAI models', error as Error);
      return [this.defaultModel];
    }
  }

  /**
   * Create embeddings using OpenAI
   */
  async createEmbeddings(
    texts: string[],
    model: string = 'text-embedding-3-small'
  ): Promise<number[][]> {
    try {
      const response = await this.client.embeddings.create({
        model,
        input: texts,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      logger.error('Failed to create embeddings', error as Error);
      throw new LLMServiceError(
        'Failed to create embeddings',
        { provider: this.getProvider(), model }
      );
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
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

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