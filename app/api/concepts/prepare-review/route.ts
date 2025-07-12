import { NextRequest } from "next/server";
import { ConceptExtractor } from "@/lib/conceptExtraction/conceptExtractor";
import { ConceptManager } from "@/lib/conceptExtraction/conceptManager";
import { createApiResponse, createErrorResponse } from "@/lib/utils/apiResponse";
import dbConnect from "@/lib/dbConnect";
import { z } from "zod";

const prepareReviewSchema = z.object({
  courseId: z.number().int().positive(),
});

/**
 * POST /api/concepts/prepare-review - Get review data for a course
 * This bridges the old and new extraction systems
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const { courseId } = prepareReviewSchema.parse(body);

    const extractor = new ConceptExtractor();
    let reviewData = await extractor.prepareReviewData(courseId);

    // If no review data found, try to create it from existing concepts
    if (!reviewData) {
      console.log(`No extraction session found for course ${courseId}, checking for existing concepts...`);
      
      // Check if there are already concepts created from this course
      const conceptManager = new ConceptManager();
      const existingConcepts = await conceptManager.getConceptsForCourse(courseId);
      
      if (existingConcepts && existingConcepts.length > 0) {
        console.log(`Found ${existingConcepts.length} existing concepts for course ${courseId}`);
        
        // Convert existing concepts to extracted concept format
        const extractedConcepts = existingConcepts.map(concept => ({
          name: concept.name,
          category: concept.category,
          description: concept.description,
          examples: concept.examples || [],
          sourceContent: `Previously extracted concept from course ${courseId}`,
          confidence: concept.confidence || 0.8,
          suggestedDifficulty: concept.difficulty
        }));

        // Create mock review data
        reviewData = {
          courseId,
          courseName: `Course ${courseId}`,
          extractedConcepts,
          similarityMatches: new Map(),
          totalExtracted: extractedConcepts.length,
          highConfidenceCount: extractedConcepts.filter(c => c.confidence > 0.8).length
        };
      }
    }

    if (!reviewData) {
      return createErrorResponse(
        "No extraction data found for this course. Please extract concepts first.",
        404
      );
    }

    console.log(`Returning review data with ${reviewData.extractedConcepts.length} concepts`);
    return createApiResponse(reviewData);

  } catch (error) {
    console.error("Error preparing review data:", error);
    return createErrorResponse(
      "Failed to prepare review data",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}