"use server"

import { OpenAIService } from "@/lib/services/llm/openAIService"
import { LLMServiceError } from "@/lib/utils/errors"
import { logger } from "@/lib/utils/logger"
import type { ICourse } from "@/datamodels/course.model"
import {
  PRACTICE_QUESTION_GENERATION_PROMPT,
  PRACTICE_QUESTION_SYSTEM_PROMPT
} from "@/prompts/validation"

const llmService = new OpenAIService({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o",
  temperature: 0.7,
  maxTokens: 800,
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
})

export async function generateQuestion(course: ICourse, previousQuestions: string[]): Promise<string> {
  try {
    const prompt = PRACTICE_QUESTION_GENERATION_PROMPT
      .replace('{course}', JSON.stringify(course, null, 2))
      .replace('{previousQuestions}', previousQuestions.length > 0 ? previousQuestions.join(", ") : "None");

    const systemPrompt = PRACTICE_QUESTION_SYSTEM_PROMPT;

    logger.info("Generating question for Polish practice session", {
      operation: "generate_question",
      courseId: course.courseId,
      previousQuestionsCount: previousQuestions.length,
    });

    const response = await llmService.generateResponse({
      prompt,
      systemPrompt,
    });

    if (!response.success || !response.data) {
      throw new LLMServiceError(
        `Question generation failed: ${response.error || "Unknown error"}`
      );
    }

    const question = response.data as string;

    logger.success("Question generated successfully", {
      operation: "generate_question",
      courseId: course.courseId,
      questionLength: question.length,
      duration: response.metadata?.duration,
    });

    return question;
  } catch (error) {
    logger.error("Failed to generate question", error as Error);
    
    if (error instanceof LLMServiceError) {
      throw error;
    }
    
    throw new LLMServiceError(
      `Question generation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}