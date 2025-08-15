"use server";

import { OpenAIService } from "@/lib/services/llm/openAIService";
import { LLMServiceError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import type { ICourse } from "@/datamodels/course.model";
import type { IQuestionAnswer } from "@/datamodels/questionAnswer.model";
import { QuestionType, MistakeType, QuestionLevel } from "@/lib/enum";
import type { ValidationResult, LLMValidationContext } from "@/lib/practiceEngine/clientValidation";
import {
  LLM_ANSWER_VALIDATION_PROMPT,
  LEGACY_ANSWER_VALIDATION_PROMPT,
  LLM_VALIDATION_SYSTEM_PROMPT,
  LEGACY_VALIDATION_SYSTEM_PROMPT
} from "@/prompts/validation";

const llmService = new OpenAIService({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o",
  temperature: 0.3,
  maxTokens: 1000,
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
});

/**
 * NEW: Immutable LLM validation that never modifies correctAnswer
 */
export async function validateAnswerWithLLM(
  context: LLMValidationContext
): Promise<ValidationResult> {
  try {
    const prompt = LLM_ANSWER_VALIDATION_PROMPT
      .replace('{question}', context.question)
      .replace('{userAnswer}', context.userAnswer)
      .replace('{correctAnswer}', context.correctAnswer)
      .replace(/\{correctAnswer\}/g, context.correctAnswer)
      .replace('{attemptNumber}', context.attemptNumber.toString());

    const systemPrompt = LLM_VALIDATION_SYSTEM_PROMPT;

    logger.info("Validating user answer with LLM", {
      operation: "validate_answer_llm",
      questionLength: context.question.length,
      answerLength: context.userAnswer.length,
      attemptNumber: context.attemptNumber,
    });

    const response = await llmService.generateResponse(
      {
        prompt,
        systemPrompt,
      },
      (rawResponse: string) => {
        try {
          const jsonMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
          const jsonString = jsonMatch ? jsonMatch[1] : rawResponse.trim();
          
          return JSON.parse(jsonString);
        } catch (error) {
          logger.warn("Failed to parse LLM validation response", {
            error: error instanceof Error ? error.message : 'Unknown error',
            response: rawResponse.substring(0, 200),
          });
          
          return {
            isCorrect: false,
            feedback: context.attemptNumber < 3 ? "Keep trying!" : `The correct answer is: ${context.correctAnswer}`,
            confidenceLevel: 0.5,
            errorType: null,
            keywords: [],
            questionLevel: QuestionLevel.A2,
            responseTime: 30,
          };
        }
      }
    );

    if (!response.success || !response.data) {
      throw new LLMServiceError(
        `LLM validation failed: ${response.error || "Unknown error"}`
      );
    }

    const result = response.data as {
      isCorrect?: boolean;
      feedback?: string;
      confidenceLevel?: number;
      errorType?: string | null;
      keywords?: string[];
      questionLevel?: string;
      responseTime?: number;
    };

    logger.success("LLM validation completed", {
      operation: "validate_answer_llm",
      isCorrect: result.isCorrect,
      attemptNumber: context.attemptNumber,
      duration: response.metadata?.duration,
    });

    // Return ValidationResult with IMMUTABLE correctAnswer
    return {
      isCorrect: Boolean(result.isCorrect),
      feedback: result.feedback || 
        (context.attemptNumber < 3 ? "Keep trying!" : `The correct answer is: ${context.correctAnswer}`),
      correctAnswer: context.correctAnswer, // ALWAYS the original stored answer
      confidence: Math.max(0, Math.min(1, result.confidenceLevel || 0)),
    };
  } catch (error) {
    logger.error("Failed to validate answer with LLM", error as Error);
    
    if (error instanceof LLMServiceError) {
      throw error;
    }
    
    throw new LLMServiceError(
      `LLM validation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * LEGACY: Keep for backward compatibility but mark as deprecated
 * @deprecated Use validateAnswerWithLLM instead
 */
export async function validateAnswer(
  question: string,
  userAnswer: string,
  course: ICourse,
  attemptNumber: number
): Promise<Partial<IQuestionAnswer>> {
  try {
    // WARNING: This legacy function should not be used for new implementations
    logger.warn("Using deprecated validateAnswer function", {
      operation: "validate_answer_legacy",
      question: question.substring(0, 50),
    });

    const prompt = LEGACY_ANSWER_VALIDATION_PROMPT
      .replace('{course}', JSON.stringify(course, null, 2))
      .replace('{question}', question)
      .replace('{userAnswer}', userAnswer)
      .replace('{attemptNumber}', attemptNumber.toString());

    const systemPrompt = LEGACY_VALIDATION_SYSTEM_PROMPT;

    logger.info("Validating user answer", {
      operation: "validate_answer",
      courseId: course.courseId,
      attemptNumber,
      questionLength: question.length,
      answerLength: userAnswer.length,
    });

    const response = await llmService.generateResponse(
      {
        prompt,
        systemPrompt,
      },
      (rawResponse: string) => {
        try {
          // Try to extract JSON from response if it's wrapped in markdown or other text
          const jsonMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
          const jsonString = jsonMatch ? jsonMatch[1] : rawResponse.trim();
          
          return JSON.parse(jsonString);
        } catch (error) {
          logger.warn("Failed to parse answer validation response", {
            error: error instanceof Error ? error.message : 'Unknown error',
            response: rawResponse.substring(0, 200),
          });
          
          // Return a fallback response structure
          return {
            isCorrect: false,
            feedback: attemptNumber < 3 ? "Keep trying!" : "Here's the correct answer.",
            correctAnswer: "No correct answer provided.",
            questionType: QuestionType.Q_A,
            confidenceLevel: 0.5,
            errorType: null,
            keywords: [],
            category: "general",
            questionLevel: QuestionLevel.A2,
            responseTime: 30,
          };
        }
      }
    );

    if (!response.success || !response.data) {
      throw new LLMServiceError(
        `Answer validation failed: ${response.error || "Unknown error"}`
      );
    }

    const result = response.data as {
      isCorrect?: boolean;
      feedback?: string;
      correctAnswer?: string;
      questionType?: string;
      confidenceLevel?: number;
      errorType?: string | null;
      keywords?: string[];
      category?: string;
      questionLevel?: string;
      responseTime?: number;
    };

    logger.success("Answer validation completed", {
      operation: "validate_answer",
      courseId: course.courseId,
      isCorrect: result.isCorrect,
      attemptNumber,
      duration: response.metadata?.duration,
    });

    return {
      isCorrect: Boolean(result.isCorrect),
      feedback:
        result.feedback ||
        (attemptNumber < 3 ? "Keep trying!" : "Here's the correct answer."),
      correctAnswer: result.correctAnswer || "No correct answer provided.",
      questionType: Object.values(QuestionType).includes(
        result.questionType as QuestionType
      )
        ? (result.questionType as QuestionType)
        : QuestionType.Q_A,
      keywords: Array.isArray(result.keywords) ? result.keywords : [],
      category: result.category || "general",
      analysisDetails: {
        mistakeType: result.errorType && Object.values(MistakeType).includes(
          result.errorType as MistakeType
        )
          ? (result.errorType as MistakeType)
          : null,
        confidence: Math.max(0, Math.min(1, result.confidenceLevel || 0)),
        questionLevel: Object.values(QuestionLevel).includes(
          result.questionLevel as QuestionLevel
        )
          ? (result.questionLevel as QuestionLevel)
          : QuestionLevel.A2,
        responseTime: result.responseTime || 0,
      },
    };
  } catch (error) {
    logger.error("Failed to validate answer", error as Error);
    
    if (error instanceof LLMServiceError) {
      throw error;
    }
    
    throw new LLMServiceError(
      `Answer validation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
