import { NextRequest } from "next/server";
import { z } from "zod";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/utils/apiResponse";
import { OpenAIService } from "@/lib/services/llm/openAIService";
import { LLMServiceError } from "@/lib/utils/errors";

const GenerateImageSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(1000, "Prompt too long (max 1000 characters)"),
  polishWord: z
    .string()
    .min(1, "Polish word is required")
    .max(100, "Polish word too long"),
  size: z
    .enum(["1024x1024", "1024x1536", "1536x1024"])
    .optional()
    .default("1024x1024"),
  questionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = GenerateImageSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse("Invalid request parameters", 400, {
        validationErrors: validationResult.error.issues,
      });
    }

    const { prompt, polishWord, size, questionId } = validationResult.data;

    // Enhance prompt for educational vocabulary learning
    const enhancedPrompt = `Educational vocabulary illustration: ${prompt}. Simple, clear, and suitable for language learning flashcard showing "${polishWord}". Clean background, bright colors, cartoon style.`;

    // Initialize OpenAI service
    const openAIService = new OpenAIService({
      apiKey: process.env.OPENAI_API_KEY!,
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Generate image using gpt-image-0721-mini-alpha model
    const imageUrl = await openAIService.generateImage(enhancedPrompt, size);

    return createSuccessResponse({
      imageUrl,
      size,
      polishWord,
      originalPrompt: prompt,
      enhancedPrompt,
      questionId,
    });
  } catch (error) {
    console.error("Image generation error:", error);

    if (error instanceof LLMServiceError) {
      const context = error.context as { status?: number; provider?: string };
      return createErrorResponse(error.message, context?.status || 500, {
        provider: context?.provider,
      });
    }

    if (error instanceof Error) {
      return createErrorResponse("Image generation failed", 500, {
        message: error.message,
      });
    }

    return createErrorResponse("Unknown error occurred", 500);
  }
}
