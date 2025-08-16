import { NextRequest } from "next/server";
import { z } from "zod";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/utils/apiResponse";
import { OpenAIService } from "@/lib/services/llm/openAIService";
import { LLMServiceError } from "@/lib/utils/errors";

const GenerateAudioSchema = z.object({
  text: z
    .string()
    .min(1, "Text is required")
    .max(4000, "Text too long (max 4000 characters)"),
  voice: z
    .enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"])
    .optional()
    .default("alloy"),
  questionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = GenerateAudioSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse("Invalid request parameters", 400, {
        validationErrors: validationResult.error.issues,
      });
    }

    const { text, voice, questionId } = validationResult.data;

    // Initialize OpenAI service
    const openAIService = new OpenAIService({
      apiKey: process.env.OPENAI_API_KEY!,
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Generate audio
    const audioBuffer = await openAIService.generateAudio(text, voice);

    // Convert to base64 for response
    const audioBase64 = audioBuffer.toString("base64");

    // Estimate duration (rough calculation: ~150 characters per second for TTS)
    const estimatedDuration = Math.ceil(text.length / 150);

    return createSuccessResponse({
      audioData: audioBase64,
      duration: estimatedDuration,
      voice,
      textLength: text.length,
      questionId,
      format: "mp3",
    });
  } catch (error) {
    console.error("Audio generation error:", error);

    if (error instanceof LLMServiceError) {
      const context = error.context as { status?: number; provider?: string };
      return createErrorResponse(error.message, context?.status || 500, {
        provider: context?.provider,
      });
    }

    if (error instanceof Error) {
      return createErrorResponse("Audio generation failed", 500, {
        message: error.message,
      });
    }

    return createErrorResponse("Unknown error occurred", 500);
  }
}
