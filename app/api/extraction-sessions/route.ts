import { NextRequest } from "next/server";
import { z } from "zod";
import ConceptExtractionSession, {
  IConceptExtractionSession,
  validateConceptExtractionSession,
  ExtractedConceptSchema,
  SimilarityDataSchema,
} from "@/datamodels/conceptExtractionSession.model";
import {
  createApiResponse,
  createErrorResponse,
} from "@/lib/utils/apiResponse";
import dbConnect from "@/lib/dbConnect";
import { duplicationDetector } from "@/lib/conceptExtraction/duplicationDetector";

// Schema for creating new session
const CreateSessionSchema = z.object({
  courseId: z.number(),
  courseName: z.string().min(1),
  extractedConcepts: z.array(ExtractedConceptSchema),
  similarityMatches: z.array(SimilarityDataSchema),
  extractionMetadata: z.object({
    llmModel: z.string(),
    totalProcessingTime: z.number(),
    extractionConfidence: z.number().min(0).max(1),
    sourceContentLength: z.number(),
  }),
});

/**
 * GET /api/extraction-sessions - Retrieve extraction sessions
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    // Parse query parameters manually
    const courseIdParam = searchParams.get("courseId");
    const statusParam = searchParams.get("status");
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    // Validate and convert parameters
    const courseId = courseIdParam ? Number(courseIdParam) : undefined;
    const status = statusParam as
      | "extracted"
      | "in-review"
      | "reviewed"
      | undefined;
    const limit = limitParam ? Number(limitParam) : 10;
    const offset = offsetParam ? Number(offsetParam) : 0;

    // Validate status if provided
    if (
      statusParam &&
      !["extracted", "in-review", "reviewed"].includes(statusParam)
    ) {
      return createErrorResponse("Invalid status parameter", 400);
    }

    // Validate numbers
    if (courseIdParam && isNaN(courseId!)) {
      return createErrorResponse("Invalid courseId parameter", 400);
    }
    if (limitParam && isNaN(limit)) {
      return createErrorResponse("Invalid limit parameter", 400);
    }
    if (offsetParam && isNaN(offset)) {
      return createErrorResponse("Invalid offset parameter", 400);
    }

    // Build query
    const query: { courseId?: number; status?: string } = {};
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;

    // Execute query with pagination
    const sessions = await ConceptExtractionSession.find(query)
      .sort({ extractionDate: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const totalCount = await ConceptExtractionSession.countDocuments(query);

    return createApiResponse({
      sessions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching extraction sessions:", error);
    return createErrorResponse(
      "Failed to fetch extraction sessions",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * POST /api/extraction-sessions - Create new extraction session
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validationResult = CreateSessionSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorResponse(
        "Invalid session data",
        400,
        validationResult.error.errors
      );
    }

    const {
      courseId,
      courseName,
      extractedConcepts,
      similarityMatches,
      extractionMetadata,
    } = validationResult.data;

    // Check for duplicates before creating session
    const duplicationResult = await duplicationDetector.checkForDuplicates(extractedConcepts);
    
    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const sessionData: Partial<IConceptExtractionSession> = {
      id: sessionId,
      courseId,
      courseName,
      extractionDate: new Date(),
      status: "extracted",
      extractedConcepts,
      similarityMatches,
      reviewProgress: {
        totalConcepts: extractedConcepts.length,
        reviewedCount: 0,
        decisions: [],
        isDraft: true,
      },
      extractionMetadata,
      // Add duplication detection results
      duplicateDetection: {
        hasDuplicates: duplicationResult.hasDuplicates,
        duplicates: duplicationResult.duplicates.map(duplicate => ({
          extractedConceptName: duplicate.extractedConceptName,
          existingConcept: {
            id: duplicate.existingConcept.id,
            name: duplicate.existingConcept.name,
            category: duplicate.existingConcept.category,
          },
          duplicateType: duplicate.duplicateType,
        })),
        checkedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate complete session data
    const sessionValidation = validateConceptExtractionSession(sessionData);
    if (!sessionValidation.success) {
      return createErrorResponse(
        "Invalid session data structure",
        400,
        sessionValidation.error.errors
      );
    }

    const session = await ConceptExtractionSession.create(sessionData);

    return createApiResponse(
      { sessionId: session.id, session },
      "Extraction session created successfully",
      201
    );
  } catch (error) {
    console.error("Error creating extraction session:", error);
    return createErrorResponse(
      "Failed to create extraction session",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * DELETE /api/extraction-sessions - Cleanup old archived sessions
 */
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get("olderThanDays") || "30");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await ConceptExtractionSession.deleteMany({
      status: "archived",
      updatedAt: { $lt: cutoffDate },
    });

    return createApiResponse(
      { deletedCount: result.deletedCount },
      `Cleaned up ${result.deletedCount} archived sessions`
    );
  } catch (error) {
    console.error("Error cleaning up extraction sessions:", error);
    return createErrorResponse(
      "Failed to cleanup extraction sessions",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
