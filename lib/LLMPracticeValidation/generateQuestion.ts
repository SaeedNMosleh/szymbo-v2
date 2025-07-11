"use server"

import { OpenAIService } from "@/lib/services/llm/openAIService"
import { LLMServiceError } from "@/lib/utils/errors"
import { logger } from "@/lib/utils/logger"
import type { ICourse } from "@/datamodels/course.model"

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
    const prompt = `Generate one question for a Polish language learning practice session based on the following course information:

    ${JSON.stringify(course, null, 2)}
    
    GUIDELINES:
    - The question should be in Polish and no longer than 3 sentences
    - Suitable for an A1 level learner
    - Creative and interesting to keep the learner engaged
    - Self-contained and meaningful with sufficient context
    - Do not ask about grammar rules directly; test them in context
    - Do not ask for translations
    - Do not ask questions that can have multiple correct answers
    
    DIFFICULTY SCALING:
    - Fewer than 3 previous questions: Basic vocabulary or simple sentence structures
    - 3 to 5 previous questions: Moderately difficult within A1 (longer sentences, additional vocabulary)
    - More than 5 previous questions: More challenging but still A1 (varied sentence patterns, contextual inference)
    - If last two questions were similar: Make this question simpler to avoid overwhelming
    
    If the course content is insufficient, generate a question based on general Polish A1 knowledge using the course content as reference.
    
    Previous questions: ${previousQuestions.length > 0 ? previousQuestions.join(", ") : "None"}`;

    const systemPrompt = "You are an experienced and wise Polish teacher that generates questions for Polish language learning practice sessions.";

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