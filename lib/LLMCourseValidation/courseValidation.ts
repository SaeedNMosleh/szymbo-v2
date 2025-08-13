"use server";

import { OpenAIService } from "@/lib/services/llm/openAIService";
import { z } from "zod";
import { connectToDatabase } from "@/lib/dbConnect";
import Course from "@/datamodels/course.model";
import { logger } from "@/lib/utils/logger";
import { createLLMJsonParser } from "@/lib/utils/jsonParser";

const llmService = new OpenAIService({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o",
  temperature: 0.1, // Lower temperature for more consistent JSON output
  maxTokens: 2000, // Increased to handle longer responses
  timeout: 45000, // Increased timeout for better reliability
  maxRetries: 4, // Increased retries for better reliability
  retryDelay: 2000,
});

const courseSchema = z.object({
  courseId: z.number().int().positive(),
  date: z.string(),
  keywords: z.string(),
  mainSubjects: z.string().optional(),
  courseType: z.enum(["new", "review", "mixed"]),
  newSubjects: z.string().optional(),
  reviewSubjects: z.string().optional(),
  weaknesses: z.string().optional(),
  strengths: z.string().optional(),
  notes: z.string(),
  practice: z.string(),
  homework: z.string().optional(),
});

export async function validateAndSaveCourse(
  data: z.infer<typeof courseSchema>,
  finalSubmission = false
) {
  try {
    // Validate data with Zod
    courseSchema.parse(data);

    logger.info("Starting course validation and save process", {
      operation: "validate_and_save_course",
      courseId: data.courseId,
      finalSubmission,
    });

    if (!finalSubmission) {
      // LLM validation
      const prompt = `Please review this course information and suggest any improvements or corrections in terms of typos, grammar issues, or any suggestions to clarify. 

CRITICAL INSTRUCTIONS:
- You MUST respond with ONLY valid JSON - no markdown, no explanations, no code blocks
- Do NOT wrap your response in \`\`\`json or any other formatting
- Return ONLY the JSON object starting with { and ending with }
- Keep the original content of any field if there are no suggestions for improvement
- If a field is empty in the input, keep it empty unless you have a specific improvement

Course information to review:
${JSON.stringify(data, null, 2)}

Return the improved version with the exact same structure, fixing any typos, grammar issues, and providing clearer language where needed. Respond with raw JSON only.`;

      const systemPrompt =
        "You are an AI assistant that validates and improves course information. You must respond with ONLY valid JSON - no markdown formatting, no explanations, no code blocks. Your response must be parseable by JSON.parse() directly.";

      try {
        logger.info("Requesting LLM validation for course", {
          operation: "llm_course_validation",
          courseId: data.courseId,
        });

        const response = await llmService.generateResponse(
          {
            prompt,
            systemPrompt,
          },
          createLLMJsonParser<Record<string, unknown>>(undefined, {
            enableRepair: true,
            logErrors: true,
          })
        );

        if (!response.success) {
          logger.warn("LLM validation failed, proceeding without validation", {
            operation: "llm_course_validation",
            error: response.error,
            courseId: data.courseId,
          });
          // Continue without validation rather than failing
        } else {
          const suggestions = response.data as Record<string, unknown>;
          logger.info("LLM validation completed successfully", {
            operation: "llm_course_validation",
            courseId: data.courseId,
            suggestionsCount: Object.keys(suggestions).length,
            duration: response.metadata?.duration,
          });

          // Check if there are meaningful suggestions (not just echoing back the same data)
          const hasRealSuggestions = Object.keys(suggestions).some((key) => {
            const original = data[key as keyof typeof data];
            const suggested = suggestions[key];
            return (
              original !== suggested &&
              suggested !== null &&
              suggested !== undefined
            );
          });

          if (hasRealSuggestions) {
            return { success: false, suggestions };
          }
        }
      } catch (error) {
        logger.error(
          "LLM validation error, proceeding without validation",
          error as Error
        );
        // Continue without validation rather than failing the entire operation
      }
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Save to MongoDB
    const course = new Course(data);
    await course.save();

    logger.success("Course saved successfully", {
      operation: "save_course",
      courseId: data.courseId,
    });

    return { success: true };
  } catch (error) {
    logger.error("Error in validateAndSaveCourse", error as Error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        details: error.errors,
      };
    }

    return {
      success: false,
      error: "Failed to validate and save course",
    };
  }
}
