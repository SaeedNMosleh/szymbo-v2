import { NextRequest } from "next/server";
import { z } from "zod";
import ConceptExtractionSession, {
  ReviewProgressSchema,
  ReviewProgress,
} from "@/datamodels/conceptExtractionSession.model";
import Course from "@/datamodels/course.model";
import { ConceptManager } from "@/lib/conceptExtraction/conceptManager";
import { duplicationDetector } from "@/lib/conceptExtraction/duplicationDetector";
import { conceptMerger } from "@/lib/conceptExtraction/conceptMerger";
import { ConceptCategory } from "@/lib/enum"; // Only import what we use

import {
  createApiResponse,
  createErrorResponse,
} from "@/lib/utils/apiResponse";
import dbConnect from "@/lib/dbConnect";

// Schema for updating session progress
const UpdateProgressSchema = z.object({
  reviewProgress: ReviewProgressSchema.partial(),
  status: z.enum(["extracted", "in-review", "reviewed"]).optional(),
});

interface UpdateData {
  updatedAt?: Date;
  reviewProgress?: Partial<ReviewProgress>;
  status?: "extracted" | "in-review" | "reviewed";
}

/**
 * GET /api/extraction-sessions/[sessionId] - Get specific extraction session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    await dbConnect();

    const { sessionId } = await params;

    if (!sessionId) {
      return createErrorResponse("Session ID is required", 400);
    }

    const session = await ConceptExtractionSession.findOne({
      id: sessionId,
    }).lean();

    if (!session) {
      return createErrorResponse("Extraction session not found", 404);
    }

    return createApiResponse(session);
  } catch (error) {
    console.error("Error fetching extraction session:", error);
    return createErrorResponse(
      "Failed to fetch extraction session",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * PATCH /api/extraction-sessions/[sessionId] - Update session progress
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    await dbConnect();

    const { sessionId } = await params;

    if (!sessionId) {
      return createErrorResponse("Session ID is required", 400);
    }

    const body = await request.json();

    const validationResult = UpdateProgressSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorResponse(
        "Invalid update data",
        400,
        validationResult.error.errors
      );
    }

    const { reviewProgress, status } = validationResult.data;

    // Build update object
    const updateData: UpdateData = {
      updatedAt: new Date(),
    };

    if (reviewProgress) {
      // Merge with existing progress
      const session = await ConceptExtractionSession.findOne({ id: sessionId });

      if (!session) {
        return createErrorResponse("Extraction session not found", 404);
      }

      updateData.reviewProgress = {
        ...session.reviewProgress,
        ...reviewProgress,
      };

      // Auto-update status based on progress
      if (reviewProgress.isDraft === false && !status) {
        updateData.status = "reviewed";
      } else if (
        reviewProgress.reviewedCount &&
        reviewProgress.reviewedCount > 0 &&
        !status
      ) {
        updateData.status = "in-review";
      }
    }

    if (status) {
      updateData.status = status;
    }

    // Add type declaration to handle mongoose types safely
    interface SessionDocument {
      id: string;
      courseId: number;
      [key: string]: unknown; // Allow other properties
    }

    const updatedSession = await ConceptExtractionSession.findOneAndUpdate(
      { id: sessionId },
      { $set: updateData },
      { new: true, lean: true }
    );

    if (!updatedSession) {
      return createErrorResponse("Extraction session not found", 404);
    }

    // Safely extract courseId
    const updatedSessionData = updatedSession as unknown as SessionDocument;
    const courseId = updatedSessionData.courseId;

    // Update corresponding course status and create concepts if session status changed to "reviewed"
    if (updateData.status === "reviewed") {
      try {
        // Update course status
        await Course.findOneAndUpdate(
          { courseId },
          { $set: { conceptExtractionStatus: "reviewed" } }
        );
        console.log(`Updated course ${courseId} status to reviewed`);

        // Create concepts from approved/edited decisions
        if (reviewProgress && reviewProgress.decisions) {
          const conceptManager = new ConceptManager();
          let createdCount = 0;
          let skippedCount = 0;
          let duplicateCount = 0;
          const creationResults: Array<{
            conceptName: string;
            status: "created" | "found" | "skipped" | "duplicate_blocked";
            reason?: string;
          }> = [];

          // Separate decisions by action type for better handling
          const approvableDecisions = reviewProgress.decisions.filter(
            (decision) =>
              ["approve", "edit", "manual_add"].includes(decision.action)
          );

          const mergeDecisions = reviewProgress.decisions.filter(
            (decision) => decision.action === "merge"
          );

          console.log(
            `Processing ${approvableDecisions.length} concepts for creation and ${mergeDecisions.length} concepts for merging`
          );

          // First handle merge decisions
          for (const decision of mergeDecisions) {
            try {
              if (!decision.mergeData?.primaryConceptId) {
                console.error(
                  `Merge decision missing primaryConceptId for concept: ${decision.extractedConcept.name}`
                );
                skippedCount++;
                creationResults.push({
                  conceptName: decision.extractedConcept.name,
                  status: "skipped",
                  reason: "Merge decision missing target concept ID",
                });
                continue;
              }

              const mergeResult = await conceptMerger.mergeExtractedConcept({
                targetConceptId: decision.mergeData.primaryConceptId,
                extractedConcept: decision.extractedConcept,
                additionalData: decision.mergeData.additionalData,
                courseId,
              });

              if (mergeResult.success) {
                createdCount++; // Count as "processed" even though it's a merge
                creationResults.push({
                  conceptName: decision.extractedConcept.name,
                  status: "found", // Use 'found' to indicate it was merged into existing
                  reason: `Merged into existing concept: ${mergeResult.mergedConcept?.name}`,
                });
                console.log(
                  `Merged concept "${decision.extractedConcept.name}" into existing concept "${mergeResult.mergedConcept?.name}"`
                );
              } else {
                skippedCount++;
                creationResults.push({
                  conceptName: decision.extractedConcept.name,
                  status: "skipped",
                  reason: `Merge failed: ${mergeResult.message}`,
                });
                console.error(
                  `Failed to merge concept ${decision.extractedConcept.name}: ${mergeResult.message}`
                );
              }
            } catch (mergeError) {
              skippedCount++;
              creationResults.push({
                conceptName: decision.extractedConcept.name,
                status: "skipped",
                reason: `Merge error: ${mergeError instanceof Error ? mergeError.message : "Unknown error"}`,
              });
              console.error(
                `Error merging concept ${decision.extractedConcept.name}:`,
                mergeError
              );
            }
          }

          // Then handle regular concept creation
          for (const decision of approvableDecisions) {
            try {
              // Use edited concept if available, otherwise use original
              const conceptToCreate =
                decision.action === "edit" && decision.editedConcept
                  ? { ...decision.extractedConcept, ...decision.editedConcept }
                  : decision.extractedConcept;

              // Convert to the format expected by ConceptManager
              interface ConceptCreateData {
                name: string;
                category: string;
                description: string;
                examples: string[];
                difficulty: string;
                tags: string[];
                courseId: number;
                vocabularyData?: {
                  word?: string;
                  translation?: string;
                  alternativeForms?: string[];
                  partOfSpeech?: string;
                };
              }

              const conceptData: ConceptCreateData = {
                name: conceptToCreate.name,
                category: conceptToCreate.category,
                description: conceptToCreate.description,
                examples: conceptToCreate.examples,
                difficulty: conceptToCreate.suggestedDifficulty,
                tags:
                  conceptToCreate.suggestedTags?.map((tag) => tag.tag) || [],
                courseId,
              };

              if (conceptToCreate.category === ConceptCategory.VOCABULARY) {
                conceptData.vocabularyData = {
                  word: conceptToCreate.name,
                  translation:
                    conceptToCreate.description || conceptToCreate.name,
                  partOfSpeech: "noun", // Default to noun
                  // Note: this object will be converted to the proper format by the ConceptManager
                };
              }

              // Check for duplicates before creating - this prevents creation of true duplicates
              const isDuplicate = await duplicationDetector.isDuplicate(
                conceptData.name,
                conceptData.category as ConceptCategory
              );

              if (isDuplicate) {
                // Skip this concept but don't fail the entire operation
                duplicateCount++;
                creationResults.push({
                  conceptName: conceptData.name,
                  status: "duplicate_blocked",
                  reason: "Concept name already exists",
                });
                console.log(`Blocked duplicate concept: ${conceptData.name}`);
                continue;
              }

              const result = await conceptManager.createOrFindConcept(
                conceptData as unknown as Partial<Record<string, unknown>>,
                true
              );

              // Define a type guard to check if result has wasCreated property
              function isCreateOrFindResult(
                result: unknown
              ): result is { concept: { name: string }; wasCreated: boolean } {
                return (
                  result !== null &&
                  typeof result === "object" &&
                  "wasCreated" in result &&
                  "concept" in result
                );
              }

              if (isCreateOrFindResult(result) && result.wasCreated) {
                createdCount++;
                creationResults.push({
                  conceptName: result.concept.name,
                  status: "created",
                });
                console.log(`Created new concept: ${result.concept.name}`);
              } else if (isCreateOrFindResult(result)) {
                skippedCount++;
                creationResults.push({
                  conceptName: result.concept.name,
                  status: "found",
                  reason: "Concept already existed",
                });
                console.log(`Found existing concept: ${result.concept.name}`);
              } else {
                // Handle the case where result is IConcept directly
                const conceptResult = result as { id: string; name: string };
                createdCount++;
                creationResults.push({
                  conceptName: conceptResult.name,
                  status: "created",
                });
                console.log(`Created new concept: ${conceptResult.name}`);
              }
            } catch (conceptError) {
              skippedCount++;
              creationResults.push({
                conceptName: decision.extractedConcept.name,
                status: "skipped",
                reason: `Error: ${conceptError instanceof Error ? conceptError.message : "Unknown error"}`,
              });
              console.error(
                `Failed to create concept ${decision.extractedConcept.name}:`,
                conceptError
              );
              // Continue with other concepts even if one fails
            }
          }

          console.log(
            `Concept creation completed: ${createdCount} created, ${skippedCount} existing/skipped, ${duplicateCount} duplicates blocked`
          );

          // Log detailed results for debugging
          if (creationResults.length > 0) {
            console.log("Concept creation results:", creationResults);
          }
        }
      } catch (error) {
        console.error(
          "Failed to update course status or create concepts:",
          error
        );
        // Don't fail the main operation if these steps fail
      }
    }

    return createApiResponse(
      updatedSession,
      "Session progress updated successfully"
    );
  } catch (error) {
    console.error("Error updating extraction session:", error);
    return createErrorResponse(
      "Failed to update extraction session",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * DELETE /api/extraction-sessions/[sessionId] - Delete specific session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    await dbConnect();

    const { sessionId } = await params;

    if (!sessionId) {
      return createErrorResponse("Session ID is required", 400);
    }

    const result = await ConceptExtractionSession.deleteOne({ id: sessionId });

    if (result.deletedCount === 0) {
      return createErrorResponse("Extraction session not found", 404);
    }

    return createApiResponse(
      { deletedCount: result.deletedCount },
      "Extraction session deleted successfully"
    );
  } catch (error) {
    console.error("Error deleting extraction session:", error);
    return createErrorResponse(
      "Failed to delete extraction session",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
