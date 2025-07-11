"use server";

import { OpenAIService } from "@/lib/services/llm/openAIService";
import { LLMServiceError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import type { ICourse } from "@/datamodels/course.model";
import type { IQuestionAnswer } from "@/datamodels/questionAnswer.model";
import { QuestionType, MistakeType, QuestionLevel } from "@/lib/enum";

const llmService = new OpenAIService({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o",
  temperature: 0.3,
  maxTokens: 1000,
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
});

export async function validateAnswer(
  question: string,
  userAnswer: string,
  course: ICourse,
  attemptNumber: number
): Promise<Partial<IQuestionAnswer>> {
  try {
    const prompt = `Validate the user's answer to the following question in the context of this course:
    
    Course: ${JSON.stringify(course, null, 2)}
    Question: ${question}
    User's Answer: ${userAnswer}
    Attempt Number: ${attemptNumber}
    
    FEEDBACK GUIDELINES:
    - Attempt 1-2: Provide smart, indirect, and creative feedback to help the user improve
    - Attempt 3: Provide the correct answer
    - Use simple A1 level Polish language for feedback
    - For typos or similar forms: Give hints that they're almost correct and need to correct typo/form
    - Don't be strict, be helpful and encouraging
    
    RESPONSE FORMAT:
    Return a JSON object with these required fields:
    {
      "isCorrect": boolean,
      "feedback": "string (hint for attempts 1-2, correct answer for attempt 3)",
      "correctAnswer": "string",
      "questionType": "one of: ${Object.values(QuestionType).join(", ")}",
      "confidenceLevel": number (0-1),
      "errorType": "one of: ${Object.values(MistakeType).join(", ")} or null",
      "keywords": ["array", "of", "2-3", "keywords"],
      "category": "string (vocabulary, grammar, listening comprehension, etc.)",
      "questionLevel": "one of: ${Object.values(QuestionLevel).join(", ")}",
      "responseTime": number (estimated seconds)
    }`;

    const systemPrompt = "You are an AI assistant that validates answers for language learning practice sessions. Always respond with valid JSON.";

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
            questionType: QuestionType.Q_AND_A,
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
        : QuestionType.Q_AND_A,
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
