import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import ConceptExtractionSession, {
  type ExtractedConcept,
  type SimilarityData,
} from "@/datamodels/conceptExtractionSession.model";
import { logger } from "@/lib/utils/logger";

// Type for MongoDB update operations in status updates
interface StatusUpdateData {
  updatedAt: Date;
  status?: string;
  extractionProgress?: {
    [key: string]: unknown;
    lastUpdated: Date;
  };
  extractedConcepts?: ExtractedConcept[];
  similarityMatches?: SimilarityData[];
}

/**
 * GET /api/concepts/extract/status/[extractionId]
 * Get real-time status of extraction progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { extractionId: string } }
) {
  try {
    await connectToDatabase();
    const { extractionId } = params;

    if (!extractionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Extraction ID is required",
        },
        { status: 400 }
      );
    }

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

    // Calculate progress percentages
    const progressData = session.extractionProgress;
    let progressPercentage = 0;
    let statusMessage = "";

    if (progressData) {
      switch (progressData.phase) {
        case "analyzing":
          progressPercentage = 5;
          statusMessage =
            "Analyzing course content and creating processing strategy";
          break;
        case "extracting": {
          const extractionProgress =
            progressData.totalChunks > 0
              ? (progressData.processedChunks / progressData.totalChunks) * 0.6 // 60% of total progress
              : 0;
          progressPercentage = 5 + extractionProgress * 100;
          statusMessage = `Extracting concepts from chunk ${progressData.processedChunks + 1} of ${progressData.totalChunks}`;
          break;
        }
        case "similarity_checking": {
          const similarityProgress =
            progressData.totalConcepts > 0
              ? (progressData.similarityChecked / progressData.totalConcepts) *
                0.3 // 30% of total progress
              : 0;
          progressPercentage = 65 + similarityProgress * 100;
          statusMessage = `Checking similarities for concept ${progressData.similarityChecked + 1} of ${progressData.totalConcepts}`;
          break;
        }
        case "finalizing":
          progressPercentage = 95;
          statusMessage =
            "Finalizing extraction results and preparing for review";
          break;
        case "completed":
          progressPercentage = 100;
          statusMessage = "Extraction completed successfully";
          break;
        case "error":
          progressPercentage = 0;
          statusMessage =
            progressData.errorMessage || "An error occurred during extraction";
          break;
        default:
          progressPercentage = 0;
          statusMessage = "Processing...";
      }
    }

    // Prepare response data
    const responseData = {
      extractionId: session.id,
      courseId: session.courseId,
      courseName: session.courseName,
      status: session.status,
      progress: {
        percentage: Math.min(100, Math.max(0, progressPercentage)),
        phase: progressData?.phase || session.status,
        currentOperation: progressData?.currentOperation || statusMessage,
        estimatedTimeRemaining: progressData?.estimatedTimeRemaining,

        // Detailed progress info
        chunks: {
          total: progressData?.totalChunks || 0,
          processed: progressData?.processedChunks || 0,
        },
        concepts: {
          total: progressData?.totalConcepts || 0,
          extracted: progressData?.extractedConcepts || 0,
          similarityChecked: progressData?.similarityChecked || 0,
        },

        // Timestamps
        startedAt: session.extractionDate,
        lastUpdated: progressData?.lastUpdated || session.updatedAt,
      },

      // Error information if applicable
      error: progressData?.errorMessage,

      // Metadata
      extractionMetadata: {
        sourceContentLength: session.extractionMetadata.sourceContentLength,
        isComplete:
          session.status === "extracted" ||
          session.status === "in-review" ||
          session.status === "reviewed",
        canProceedToReview:
          session.status === "extracted" &&
          session.extractedConcepts.length > 0,
      },
    };

    logger.info("Status check completed", {
      operation: "status_check",
      extractionId,
      status: session.status,
      progressPercentage: Math.round(progressPercentage),
    });

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Status check failed", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get extraction status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/concepts/extract/status/[extractionId]
 * Update extraction progress (internal use by processing endpoints)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { extractionId: string } }
) {
  try {
    await connectToDatabase();
    const { extractionId } = params;
    const body = await request.json();

    if (!extractionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Extraction ID is required",
        },
        { status: 400 }
      );
    }

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

    // Update progress data
    const updateData: StatusUpdateData = {
      updatedAt: new Date(),
    };

    if (body.status) {
      updateData.status = body.status;
    }

    if (body.extractionProgress) {
      updateData.extractionProgress = {
        ...session.extractionProgress,
        ...body.extractionProgress,
        lastUpdated: new Date(),
      };
    }

    if (body.extractedConcepts) {
      updateData.extractedConcepts = body.extractedConcepts;
    }

    if (body.similarityMatches) {
      updateData.similarityMatches = body.similarityMatches;
    }

    // Update session
    await ConceptExtractionSession.updateOne(
      { id: extractionId },
      { $set: updateData }
    );

    logger.info("Progress updated", {
      operation: "progress_update",
      extractionId,
      phase: body.extractionProgress?.phase,
      status: body.status,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Progress updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Progress update failed", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update progress",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
