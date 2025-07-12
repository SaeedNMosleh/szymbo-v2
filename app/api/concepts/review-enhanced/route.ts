import { NextRequest } from "next/server";
import { z } from "zod";
import { ConceptManager } from "@/lib/conceptExtraction/conceptManager";
import ConceptExtractionSession, {
  ReviewDecisionSchema,
  ExtractedConcept,
} from "@/datamodels/conceptExtractionSession.model";
import { createApiResponse, createErrorResponse } from "@/lib/utils/apiResponse";
import dbConnect from "@/lib/dbConnect";
import { v4 as uuidv4 } from "uuid";

// Schema for enhanced review request
const EnhancedReviewRequestSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  decisions: z.array(ReviewDecisionSchema).min(1, "At least one decision is required"),
  finalizeSession: z.boolean().default(true),
});

interface MergeAdditionalData {
  examples?: string[];
  description?: string;
}

/**
 * POST /api/concepts/review-enhanced - Process enhanced review decisions
 * Handles all action types: approve, edit, link, merge, manual_add, reject
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validationResult = EnhancedReviewRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorResponse(
        "Invalid review request",
        400,
        validationResult.error.errors
      );
    }

    const { sessionId, decisions, finalizeSession } = validationResult.data;

    // Get the extraction session
    const session = await ConceptExtractionSession.findOne({ id: sessionId });
    if (!session) {
      return createErrorResponse("Extraction session not found", 404);
    }

    const conceptManager = new ConceptManager();
    const results = {
      success: true,
      processed: 0,
      created: 0,
      linked: 0,
      merged: 0,
      edited: 0,
      manualAdded: 0,
      rejected: 0,
      errors: [] as string[],
    };

    // Process each decision
    for (const decision of decisions) {
      try {
        const {
          action,
          extractedConcept,
          targetConceptId,
          editedConcept,
          mergeData,
        } = decision;

        switch (action) {
          case "approve": {
            // Create concept as-is
            await createConceptFromExtracted(
              conceptManager,
              extractedConcept,
              decision.courseId
            );
            results.created++;
            break;
          }

          case "edit": {
            // Create concept with edits
            if (!editedConcept) {
              throw new Error("Edited concept data is required for edit action");
            }
            const mergedConcept = { ...extractedConcept, ...editedConcept };
            await createConceptFromExtracted(
              conceptManager,
              mergedConcept,
              decision.courseId
            );
            results.edited++;
            break;
          }

          case "link": {
            // Link to existing concept
            if (!targetConceptId) {
              throw new Error("Target concept ID is required for link action");
            }
            await linkToExistingConcept(
              conceptManager,
              targetConceptId,
              extractedConcept,
              decision.courseId
            );
            results.linked++;
            break;
          }

          case "merge": {
            // Merge with existing concept
            if (!mergeData?.primaryConceptId) {
              throw new Error(
                "Merge data with primary concept ID is required for merge action"
              );
            }
            await mergeWithExistingConcept(
              conceptManager,
              mergeData.primaryConceptId,
              extractedConcept,
              mergeData.additionalData as MergeAdditionalData,
              decision.courseId
            );
            results.merged++;
            break;
          }

          case "manual_add": {
            // Add manually created concept
            await createConceptFromExtracted(
              conceptManager,
              extractedConcept,
              decision.courseId
            );
            results.manualAdded++;
            break;
          }

          case "reject": {
            // Do nothing - just count rejection
            results.rejected++;
            break;
          }

          default:
            throw new Error(`Unknown action: ${action}`);
        }

        results.processed++;
      } catch (error) {
        const errorMessage = `Error processing concept "${
          decision.extractedConcept.name
        }": ${error instanceof Error ? error.message : String(error)}`;
        results.errors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    // Update session with final decisions and status
    const updatedProgress = {
      ...session.reviewProgress,
      decisions: [...session.reviewProgress.decisions, ...decisions],
      reviewedCount: session.reviewProgress.reviewedCount + results.processed,
      lastReviewedAt: new Date(),
      isDraft: !finalizeSession,
    };

    await ConceptExtractionSession.updateOne(
      { id: sessionId },
      { 
        $set: {
          reviewProgress: updatedProgress,
          status: finalizeSession ? "reviewed" : "in_review",
          updatedAt: new Date(),
        },
      }
    );

    // If finalizing and successful, archive the session
    if (finalizeSession && results.errors.length === 0) {
      setTimeout(async () => {
        await ConceptExtractionSession.updateOne(
          { id: sessionId },
          { $set: { status: "archived", updatedAt: new Date() } }
        );
      }, 5000); // Archive after 5 seconds
    }

    // Determine overall success
    results.success = results.errors.length === 0 || results.processed > 0;

    return createApiResponse(
      results,
      `Review processing completed. ${results.processed} concepts processed with ${results.errors.length} errors.`
    );
  } catch (error) {
    console.error("Error processing enhanced review:", error);
    return createErrorResponse(
      "Failed to process review decisions",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * Helper function to create a concept from extracted data
 */
async function createConceptFromExtracted(
  conceptManager: ConceptManager,
  extractedConcept: ExtractedConcept,
  courseId: number
): Promise<void> {
  const newConcept = await conceptManager.createOrFindConcept({
    id: uuidv4(),
    name: extractedConcept.name,
    category: extractedConcept.category,
    description: extractedConcept.description,
    examples: extractedConcept.examples,
    difficulty: extractedConcept.suggestedDifficulty,
    confidence: extractedConcept.confidence,
    createdFrom: [courseId.toString()],
    isActive: true,
    lastUpdated: new Date(),
    prerequisites: [],
    relatedConcepts: [],
  });

  await conceptManager.linkConceptToCourse(
    newConcept.id,
    courseId,
    extractedConcept.confidence,
    extractedConcept.sourceContent
  );
}

/**
 * Helper function to link to an existing concept
 */
async function linkToExistingConcept(
  conceptManager: ConceptManager,
  targetConceptId: string,
  extractedConcept: ExtractedConcept,
  courseId: number
): Promise<void> {
  // Get existing concept
  const existingConcept = await conceptManager.getConcept(targetConceptId);
  if (!existingConcept) {
    throw new Error(`Target concept ${targetConceptId} not found`);
  }

  // Update existing concept to include this course
  const createdFrom = [...(existingConcept.createdFrom || [])];
  if (!createdFrom.includes(courseId.toString())) {
    createdFrom.push(courseId.toString());
    await conceptManager.updateConcept(targetConceptId, {
      createdFrom,
      lastUpdated: new Date(),
    });
  }

  // Link to course
  await conceptManager.linkConceptToCourse(
    targetConceptId,
    courseId,
    extractedConcept.confidence,
    extractedConcept.sourceContent
  );
}

/**
 * Helper function to merge with an existing concept
 */
async function mergeWithExistingConcept(
  conceptManager: ConceptManager,
  primaryConceptId: string,
  extractedConcept: ExtractedConcept,
  additionalData: MergeAdditionalData,
  courseId: number
): Promise<void> {
  // Get existing concept
  const existingConcept = await conceptManager.getConcept(primaryConceptId);
  if (!existingConcept) {
    throw new Error(`Primary concept ${primaryConceptId} not found`);
  }

  // Merge data
  const updates: Partial<typeof existingConcept> = {
    lastUpdated: new Date(),
  };

  // Merge examples
  if (additionalData.examples && Array.isArray(additionalData.examples)) {
    const existingExamples = existingConcept.examples || [];
    const newExamples = additionalData.examples.filter(
      (example: string) => !existingExamples.includes(example)
    );
    if (newExamples.length > 0) {
      updates.examples = [...existingExamples, ...newExamples];
    }
  }

  // Merge description (append if different)
  if (
    additionalData.description &&
    additionalData.description !== existingConcept.description
  ) {
    updates.description = `${existingConcept.description}\n\nAdditional: ${ 
      additionalData.description
    }`;
  }

  // Update createdFrom
  const createdFrom = [...(existingConcept.createdFrom || [])];
  if (!createdFrom.includes(courseId.toString())) {
    createdFrom.push(courseId.toString());
    updates.createdFrom = createdFrom;
  }

  // Apply updates
  if (Object.keys(updates).length > 1) {
    // More than just lastUpdated
    await conceptManager.updateConcept(primaryConceptId, updates);
  }

  // Link to course
  await conceptManager.linkConceptToCourse(
    primaryConceptId,
    courseId,
    extractedConcept.confidence,
    extractedConcept.sourceContent
  );
}