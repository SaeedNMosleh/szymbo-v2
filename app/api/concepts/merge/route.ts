import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { conceptMerger } from "@/lib/conceptExtraction/conceptMerger";
import { validateMergeCompatibility } from "@/lib/conceptExtraction/mergeValidator";
import Concept from "@/datamodels/concept.model";
import { createOperationLogger } from "@/lib/utils/logger";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/utils/apiResponse";
import { z } from "zod";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

const requestLogger = createOperationLogger("concepts-merge-api");

// Request validation schema for concept merging (updated for new interface)
const mergeConceptsSchema = z.object({
  targetConceptId: z.string().min(1, "Target concept ID is required"),
  sourceConceptIds: z
    .array(z.string())
    .min(1, "At least 1 source concept required for merging"),
  finalConceptData: z.object({
    name: z.string().min(1, "Concept name is required"),
    category: z.nativeEnum(ConceptCategory),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    examples: z.array(z.string()).min(1, "At least one example is required"),
    sourceContent: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    suggestedDifficulty: z.nativeEnum(QuestionLevel),
    suggestedTags: z
      .array(
        z.object({
          tag: z.string(),
          source: z.enum(["existing", "new"]),
          confidence: z.number(),
        })
      )
      .optional(),
  }),
});

// POST /api/concepts/merge - Merge multiple concepts into one
export async function POST(request: NextRequest) {
  requestLogger.info("Starting concept merge request");

  try {
    await connectToDatabase();

    const requestData = await request.json();
    requestLogger.debug("Merge request data received", {
      targetConceptId: requestData.targetConceptId,
      sourceConceptIds: requestData.sourceConceptIds,
      hasFinalData: !!requestData.finalConceptData,
    });

    // Validate request body
    const validatedData = mergeConceptsSchema.parse(requestData);
    const { targetConceptId, sourceConceptIds, finalConceptData } =
      validatedData;

    // Get all concepts for validation
    const allConceptIds = [targetConceptId, ...sourceConceptIds];
    const concepts = await Concept.find({
      id: { $in: allConceptIds },
      isActive: true,
    });

    if (concepts.length !== allConceptIds.length) {
      const foundIds = concepts.map((c) => c.id);
      const missingIds = allConceptIds.filter((id) => !foundIds.includes(id));
      return createErrorResponse(
        `Concepts not found or inactive: ${missingIds.join(", ")}`,
        400
      );
    }

    // Convert to summary format for validation
    const conceptSummaries = concepts.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      difficulty: c.difficulty,
      tags: c.tags || [],
      isActive: c.isActive,
      lastUpdated: c.lastUpdated?.toISOString() || new Date().toISOString(),
    }));

    // Validate merge compatibility
    const validation = validateMergeCompatibility(conceptSummaries);
    if (!validation.isValid) {
      return createErrorResponse(
        `Merge validation failed: ${validation.error}`,
        400
      );
    }

    requestLogger.info("Validation passed, proceeding with merge", {
      conceptCount: concepts.length,
      targetName: concepts.find((c) => c.id === targetConceptId)?.name,
    });

    // Transform finalConceptData to the format expected by ConceptMerger
    const transformedFinalData = {
      name: finalConceptData.name,
      category: finalConceptData.category,
      description: finalConceptData.description,
      examples: finalConceptData.examples,
      tags: finalConceptData.suggestedTags?.map((tag) => tag.tag) || [],
      difficulty: finalConceptData.suggestedDifficulty,
      confidence: finalConceptData.confidence || 1.0,
      sourceContent: finalConceptData.sourceContent,
      lastUpdated: new Date(),
    };

    // Perform the merge using ConceptMerger
    const mergeResult = await conceptMerger.mergeMultipleExistingConcepts({
      targetConceptId,
      sourceConceptIds,
      finalConceptData: transformedFinalData,
    });

    if (!mergeResult.success) {
      requestLogger.error("Merge operation failed", {
        error: mergeResult.message,
        errors: mergeResult.errors,
      });
      return createErrorResponse(mergeResult.message, 500);
    }

    requestLogger.success("Concept merge completed successfully", {
      targetId: targetConceptId,
      sourceIds: sourceConceptIds,
      mergedConceptName: mergeResult.mergedConcept?.name,
    });

    return createSuccessResponse({
      mergedConcept: mergeResult.mergedConcept,
      message: mergeResult.message,
      mergeDetails: {
        targetConceptId,
        sourceConceptIds,
        mergedConceptName: mergeResult.mergedConcept?.name,
        mergeDate: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      requestLogger.error("Validation failed", { errors: error.errors });
      return createErrorResponse("Validation failed", 400, error.errors);
    }

    requestLogger.error("Unexpected error in concept merge", error as Error);

    return createErrorResponse(
      "An unexpected error occurred during concept merge",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
