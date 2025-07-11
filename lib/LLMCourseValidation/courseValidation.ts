"use server"

import { OpenAIService } from "@/lib/services/llm/openAIService"
import { z } from "zod"
import { connectToDatabase } from "@/lib/dbConnect"
import Course from "@/datamodels/course.model"
import { LLMServiceError } from "@/lib/utils/errors"
import { logger } from "@/lib/utils/logger"

const llmService = new OpenAIService({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o",
  temperature: 0.3,
  maxTokens: 1500,
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
})

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
})




export async function validateAndSaveCourse(data: z.infer<typeof courseSchema>, finalSubmission = false) {
  try {
    // Validate data with Zod
    courseSchema.parse(data)

    logger.info("Starting course validation and save process", {
      operation: "validate_and_save_course",
      courseId: data.courseId,
      finalSubmission,
    })

    if (!finalSubmission) {
      // LLM validation
      const prompt = `Please review this course information and suggest any improvements or corrections in terms of typo, grammar issues or any suggestion to clarify. There is no need for explanation, you must only return the revised version in JSON format. Please keep the original content of key if there is no suggestion for that key or if the input is empty.
      
      The User inputs for course information: 
      ${JSON.stringify(data, null, 2)}
      
      Return the improved version with the same structure, fixing any typos, grammar issues, and providing clearer language where needed.`;

      const systemPrompt = "You are an AI assistant that helps validate and improve course information. Provide suggestions in a structured JSON format with the same structure as the input.";

      try {
        logger.info("Requesting LLM validation for course", {
          operation: "llm_course_validation",
          courseId: data.courseId,
        })

        const response = await llmService.generateResponse(
          {
            prompt,
            systemPrompt,
          },
          (rawResponse: string) => {
            try {
              return JSON.parse(rawResponse);
            } catch (error) {
              logger.warn("Failed to parse LLM response", {
                error: error instanceof Error ? error.message : 'Unknown error',
                response: rawResponse.substring(0, 200),
              });
              throw new LLMServiceError("Failed to parse LLM response as JSON");
            }
          }
        );

        if (!response.success) {
          logger.warn("LLM validation failed, proceeding without validation", {
            operation: "llm_course_validation",
            error: response.error,
          });
          // Continue without validation rather than failing
        } else {
          const suggestions = response.data as Record<string, unknown>;
          logger.info("LLM validation completed", {
            operation: "llm_course_validation",
            suggestionsCount: Object.keys(suggestions).length,
            duration: response.metadata?.duration,
          });

          // Check if there are meaningful suggestions (not just echoing back the same data)
          const hasRealSuggestions = Object.keys(suggestions).some(key => {
            const original = data[key as keyof typeof data];
            const suggested = suggestions[key];
            return original !== suggested && suggested !== null && suggested !== undefined;
          });

          if (hasRealSuggestions) {
            return { success: false, suggestions };
          }
        }
      } catch (error) {
        logger.error("LLM validation error, proceeding without validation", error as Error);
        // Continue without validation rather than failing the entire operation
      }
    }

    // Connect to MongoDB
    await connectToDatabase()

    // Save to MongoDB
    const course = new Course(data)
    await course.save()

    logger.success("Course saved successfully", {
      operation: "save_course",
      courseId: data.courseId,
    })

    return { success: true }
  } catch (error) {
    logger.error("Error in validateAndSaveCourse", error as Error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "Validation failed", 
        details: error.errors 
      };
    }
    
    return { 
      success: false, 
      error: "Failed to validate and save course" 
    };
  }
}