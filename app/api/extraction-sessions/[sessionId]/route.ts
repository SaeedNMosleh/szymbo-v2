import { NextRequest } from "next/server";
import { z } from "zod";
import ConceptExtractionSession, {
  ReviewProgressSchema,
  ReviewProgress
} from "@/datamodels/conceptExtractionSession.model";
import { createApiResponse, createErrorResponse } from "@/lib/utils/apiResponse";
import dbConnect from "@/lib/dbConnect";

// Schema for updating session progress
const UpdateProgressSchema = z.object({
  reviewProgress: ReviewProgressSchema.partial(),
  status: z.enum(['extracted', 'in_review', 'reviewed', 'archived']).optional()
});

interface UpdateData {
  updatedAt?: Date;
  reviewProgress?: Partial<ReviewProgress>;
  status?: 'extracted' | 'in_review' | 'reviewed' | 'archived';
}

/**
 * GET /api/extraction-sessions/[sessionId] - Get specific extraction session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    await dbConnect();

    const { sessionId } = params;

    if (!sessionId) {
      return createErrorResponse("Session ID is required", 400);
    }

    const session = await ConceptExtractionSession.findOne({ id: sessionId }).lean();

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
  { params }: { params: { sessionId: string } }
) {
  try {
    await dbConnect();

    const { sessionId } = params;

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
      updatedAt: new Date()
    };

    if (reviewProgress) {
      // Merge with existing progress
      const session = await ConceptExtractionSession.findOne({ id: sessionId });
      
      if (!session) {
        return createErrorResponse("Extraction session not found", 404);
      }

      updateData.reviewProgress = {
        ...session.reviewProgress,
        ...reviewProgress
      };

      // Auto-update status based on progress
      if (reviewProgress.isDraft === false && !status) {
        updateData.status = 'reviewed';
      } else if (reviewProgress.reviewedCount && reviewProgress.reviewedCount > 0 && !status) {
        updateData.status = 'in_review';
      }
    }

    if (status) {
      updateData.status = status;
    }

    const updatedSession = await ConceptExtractionSession.findOneAndUpdate(
      { id: sessionId },
      { $set: updateData },
      { new: true, lean: true }
    );

    if (!updatedSession) {
      return createErrorResponse("Extraction session not found", 404);
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
  { params }: { params: { sessionId: string } }
) {
  try {
    await dbConnect();

    const { sessionId } = params;

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