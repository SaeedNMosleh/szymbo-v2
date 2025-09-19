import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptLLMService } from "@/lib/conceptExtraction/conceptLLM";
import { ConceptManager } from "@/lib/conceptExtraction/conceptManager";
import ConceptExtractionSession, {
  SimilarityData,
} from "@/datamodels/conceptExtractionSession.model";
import {
  ExtractedConcept,
  SimilarityMatch,
} from "@/lib/conceptExtraction/types";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";

const similarityRequestSchema = z.object({
  extractionId: z.string().min(1),
  batchSize: z.number().min(1).max(10).optional().default(3), // Process 3 concepts at a time by default
});

// Type for MongoDB update operations during similarity checking
interface SimilarityUpdateData {
  similarityMatches: SimilarityData[];
  "extractionProgress.similarityChecked": number;
  "extractionProgress.currentOperation": string;
  "extractionProgress.lastUpdated": Date;
  updatedAt: Date;
  status?: string;
  "extractionProgress.phase"?: string;
  "reviewProgress.totalConcepts"?: number;
  "extractionMetadata.extractionConfidence"?: number;
  "extractionMetadata.totalProcessingTime"?: number;
}

/**
 * POST /api/concepts/extract/similarity
 * Process similarity checking for extracted concepts in batches
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const { extractionId, batchSize } = similarityRequestSchema.parse(body);

    logger.info("Starting similarity processing", {
      operation: "similarity_processing",
      extractionId,
      batchSize,
    });

    // Find extraction session
    const session = await ConceptExtractionSession.findOne({
      id: extractionId,
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Extraction session not found",
        },
        { status: 404 }
      );
    }

    // Validate session status
    if (session.status !== "similarity_checking") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot process similarity in status: ${session.status}`,
        },
        { status: 400 }
      );
    }

    // Get concepts that haven't been similarity checked yet
    const totalConcepts = session.extractedConcepts.length;
    const alreadyChecked = session.extractionProgress?.similarityChecked || 0;

    if (alreadyChecked >= totalConcepts) {
      // All concepts have been checked, move to finalization
      await ConceptExtractionSession.updateOne(
        { id: extractionId },
        {
          $set: {
            status: "extracted",
            "extractionProgress.phase": "finalizing",
            "extractionProgress.currentOperation":
              "Finalizing extraction results",
            "extractionProgress.lastUpdated": new Date(),
          },
        }
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            extractionId,
            message: "All concepts similarity checked, ready for finalization",
            progress: {
              similarityChecked: alreadyChecked,
              totalConcepts,
              percentage: 100,
            },
            nextPhase: "finalizing",
          },
        },
        { status: 200 }
      );
    }

    // Get the next batch of concepts to check
    const conceptsToCheck = session.extractedConcepts.slice(
      alreadyChecked,
      alreadyChecked + batchSize
    );

    if (conceptsToCheck.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No concepts available for similarity checking",
        },
        { status: 400 }
      );
    }

    // Initialize services
    const llmService = new ConceptLLMService();
    const conceptManager = new ConceptManager();

    // Get existing concept index for similarity checking
    const conceptIndex = await conceptManager.getConceptIndex();

    // Process each concept in the batch
    const batchResults: SimilarityData[] = [];
    let processedCount = 0;

    for (const concept of conceptsToCheck) {
      try {
        // Update current operation
        await ConceptExtractionSession.updateOne(
          { id: extractionId },
          {
            $set: {
              "extractionProgress.currentOperation": `Checking similarity for concept: ${concept.name}`,
              "extractionProgress.lastUpdated": new Date(),
            },
          }
        );

        let similarityMatches: SimilarityMatch[] = [];

        // Only check similarity if there are existing concepts
        if (conceptIndex.length > 0) {
          similarityMatches = await llmService.checkConceptSimilarity(
            concept,
            conceptIndex
          );
        }

        batchResults.push({
          extractedConceptName: concept.name,
          matches: similarityMatches,
        });

        processedCount++;

        // Add a small delay between concepts to avoid rate limiting
        if (processedCount < conceptsToCheck.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        logger.error(
          `Error checking similarity for concept "${concept.name}"`,
          error as Error
        );

        // Add empty result for failed concept
        batchResults.push({
          extractedConceptName: concept.name,
          matches: [],
        });
        processedCount++;
      }
    }

    // Update session with similarity results
    const updatedSimilarityMatches = [
      ...session.similarityMatches,
      ...batchResults,
    ];

    const newSimilarityChecked = alreadyChecked + processedCount;
    const isComplete = newSimilarityChecked >= totalConcepts;

    const updateData: SimilarityUpdateData = {
      similarityMatches: updatedSimilarityMatches,
      "extractionProgress.similarityChecked": newSimilarityChecked,
      "extractionProgress.currentOperation": isComplete
        ? "Similarity checking completed"
        : `Checked ${newSimilarityChecked}/${totalConcepts} concepts`,
      "extractionProgress.lastUpdated": new Date(),
      updatedAt: new Date(),
    };

    // If all concepts checked, move to extracted status
    if (isComplete) {
      updateData.status = "extracted";
      updateData["extractionProgress.phase"] = "completed";
      updateData["reviewProgress.totalConcepts"] = totalConcepts;

      // Calculate final extraction metadata
      const extractionConfidence =
        totalConcepts > 0
          ? session.extractedConcepts.reduce(
              (sum: number, c: ExtractedConcept) => sum + c.confidence,
              0
            ) / totalConcepts
          : 0;

      updateData["extractionMetadata.extractionConfidence"] =
        extractionConfidence;
      updateData["extractionMetadata.totalProcessingTime"] =
        Date.now() - session.extractionDate.getTime();
    }

    await ConceptExtractionSession.updateOne(
      { id: extractionId },
      { $set: updateData }
    );

    const processingTime = Date.now() - startTime;

    logger.success("Similarity processing batch completed", {
      operation: "similarity_processing",
      extractionId,
      processedInBatch: processedCount,
      totalProcessed: newSimilarityChecked,
      totalConcepts,
      processingTime,
      isComplete,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          extractionId,
          batch: {
            processed: processedCount,
            concepts: conceptsToCheck.map((c: ExtractedConcept) => c.name),
          },
          progress: {
            similarityChecked: newSimilarityChecked,
            totalConcepts,
            percentage: Math.round(
              (newSimilarityChecked / totalConcepts) * 100
            ),
          },
          nextPhase: isComplete ? "completed" : "similarity_checking",
          canProceedToReview: isComplete,
        },
        message: `Similarity checked for ${processedCount} concepts (${newSimilarityChecked}/${totalConcepts} total)`,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error("Similarity processing failed", error as Error);

    // Try to update session with error status
    try {
      const { extractionId } = similarityRequestSchema.parse(
        await request.json()
      );
      await ConceptExtractionSession.updateOne(
        { id: extractionId },
        {
          $set: {
            status: "error",
            "extractionProgress.phase": "error",
            "extractionProgress.errorMessage":
              error instanceof Error ? error.message : "Unknown error",
            "extractionProgress.lastUpdated": new Date(),
          },
        }
      );
    } catch (updateError) {
      logger.error(
        "Failed to update session with error status",
        updateError as Error
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Similarity processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
