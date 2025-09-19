import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import ConceptExtractionSession, {
  type ExtractedConcept,
  type SimilarityData,
  type IConceptExtractionSession,
} from "@/datamodels/conceptExtractionSession.model";
import Course from "@/datamodels/course.model";
import { ConceptExtractionStatus } from "@/lib/enum";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";

const finalizeRequestSchema = z.object({
  extractionId: z.string().min(1),
});

// Type for extraction metadata
interface ExtractionMetadata {
  llmModel: string;
  totalProcessingTime: number;
  extractionConfidence: number;
  sourceContentLength: number;
}

// Type for MongoDB update operations
interface UpdateData {
  status: string;
  extractionMetadata: ExtractionMetadata;
  "extractionProgress.phase": string;
  "extractionProgress.currentOperation": string;
  "extractionProgress.lastUpdated": Date;
  "reviewProgress.totalConcepts": number;
  updatedAt: Date;
}

/**
 * POST /api/concepts/extract/finalize
 * Finalize extraction process and prepare data for review
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const { extractionId } = finalizeRequestSchema.parse(body);

    logger.info("Starting extraction finalization", {
      operation: "extraction_finalization",
      extractionId,
    });

    // Find extraction session
    const session = (await ConceptExtractionSession.findOne({
      id: extractionId,
    })) as IConceptExtractionSession | null;

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Extraction session not found",
        },
        { status: 404 }
      );
    }

    // Validate session is ready for finalization
    if (!["extracted", "similarity_checking"].includes(session.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot finalize extraction in status: ${session.status}`,
        },
        { status: 400 }
      );
    }

    // Ensure all concepts have been similarity checked
    const totalConcepts = session.extractedConcepts.length;
    const similarityChecked =
      session.extractionProgress?.similarityChecked || 0;

    if (similarityChecked < totalConcepts) {
      return NextResponse.json(
        {
          success: false,
          error: `Similarity checking incomplete: ${similarityChecked}/${totalConcepts} concepts checked`,
        },
        { status: 400 }
      );
    }

    // Update session to finalized state
    const finalExtractionMetadata = {
      ...session.extractionMetadata,
      totalProcessingTime: Date.now() - session.extractionDate.getTime(),
      extractionConfidence:
        totalConcepts > 0
          ? session.extractedConcepts.reduce(
              (sum: number, c: ExtractedConcept) => sum + c.confidence,
              0
            ) / totalConcepts
          : 0,
    };

    // Prepare final similarity map for backward compatibility
    const similarityMap = new Map();
    session.similarityMatches.forEach((data: SimilarityData) => {
      similarityMap.set(data.extractedConceptName, data.matches);
    });

    // Calculate statistics
    const highConfidenceCount = session.extractedConcepts.filter(
      (c: ExtractedConcept) => c.confidence > 0.8
    ).length;
    const conceptCategories = new Set(
      session.extractedConcepts.map((c: ExtractedConcept) => c.category)
    ).size;
    const averageConfidence = finalExtractionMetadata.extractionConfidence;

    // Update extraction session
    const updateData: UpdateData = {
      status: "extracted",
      extractionMetadata: finalExtractionMetadata,
      "extractionProgress.phase": "completed",
      "extractionProgress.currentOperation":
        "Extraction completed successfully",
      "extractionProgress.lastUpdated": new Date(),
      "reviewProgress.totalConcepts": totalConcepts,
      updatedAt: new Date(),
    };

    await ConceptExtractionSession.updateOne(
      { id: extractionId },
      { $set: updateData }
    );

    // Update course status
    try {
      await Course.updateOne(
        { courseId: session.courseId },
        {
          $set: {
            conceptExtractionStatus: ConceptExtractionStatus.EXTRACTED,
            conceptExtractionDate: new Date(),
            extractedConcepts: session.extractedConcepts.map(
              (c: ExtractedConcept) => c.name
            ),
          },
        }
      );
    } catch (courseUpdateError) {
      logger.error(
        "Failed to update course status",
        courseUpdateError as Error
      );
      // Non-fatal error, continue with response
    }

    // Prepare review data for backward compatibility
    const reviewData = {
      courseId: session.courseId,
      courseName: session.courseName,
      extractedConcepts: session.extractedConcepts,
      similarityMatches: similarityMap,
      totalExtracted: totalConcepts,
      highConfidenceCount,
      extractionId,
      statistics: {
        totalConcepts,
        highConfidenceCount,
        conceptCategories,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        processingTime: Math.round(
          finalExtractionMetadata.totalProcessingTime / 1000
        ), // in seconds
        chunksProcessed: session.extractionProgress?.totalChunks || 0,
      },
    };

    logger.success("Extraction finalization completed", {
      operation: "extraction_finalization",
      extractionId,
      courseId: session.courseId,
      totalConcepts,
      highConfidenceCount,
      averageConfidence,
      processingTime: finalExtractionMetadata.totalProcessingTime,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          extractionId,
          reviewData,
          canProceedToReview: true,
          statistics: reviewData.statistics,
        },
        message: `Extraction completed: ${totalConcepts} concepts extracted with ${Math.round(averageConfidence * 100)}% average confidence`,
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

    logger.error("Extraction finalization failed", error as Error);

    // Try to update session with error status
    try {
      const { extractionId } = finalizeRequestSchema.parse(
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
        error: "Extraction finalization failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/concepts/extract/finalize?extractionId=xxx
 * Get finalized extraction results for review
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const extractionId = searchParams.get("extractionId");

    if (!extractionId) {
      return NextResponse.json(
        {
          success: false,
          error: "extractionId parameter is required",
        },
        { status: 400 }
      );
    }

    // Find extraction session
    const session = (await ConceptExtractionSession.findOne({
      id: extractionId,
    })) as IConceptExtractionSession | null;

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Extraction session not found",
        },
        { status: 404 }
      );
    }

    // Validate session is finalized
    if (session.status !== "extracted") {
      return NextResponse.json(
        {
          success: false,
          error: `Extraction not finalized. Current status: ${session.status}`,
        },
        { status: 400 }
      );
    }

    // Prepare similarity map for backward compatibility
    const similarityMap = new Map();
    session.similarityMatches.forEach((data: SimilarityData) => {
      similarityMap.set(data.extractedConceptName, data.matches);
    });

    // Prepare review data
    const reviewData = {
      courseId: session.courseId,
      courseName: session.courseName,
      extractedConcepts: session.extractedConcepts,
      similarityMatches: similarityMap,
      totalExtracted: session.extractedConcepts.length,
      highConfidenceCount: session.extractedConcepts.filter(
        (c: ExtractedConcept) => c.confidence > 0.8
      ).length,
      extractionId,
    };

    return NextResponse.json(
      {
        success: true,
        data: reviewData,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Failed to get finalized extraction results", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get extraction results",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
