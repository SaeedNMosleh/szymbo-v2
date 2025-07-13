import { NextRequest } from "next/server";
import { z } from "zod";
import ConceptExtractionSession, {
  IConceptExtractionSession,
  ReviewDecisionSchema,
} from "@/datamodels/conceptExtractionSession.model";
import {
  createApiResponse,
  createErrorResponse,
} from "@/lib/utils/apiResponse";
import dbConnect from "@/lib/dbConnect";

// Define a type for the route context
interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

// Schema for adding review decisions
const AddDecisionSchema = z.object({
  decisions: z.array(ReviewDecisionSchema).min(1),
});

// Schema for updating a specific decision
const UpdateDecisionSchema = z.object({
  decisionIndex: z.number().min(0),
  decision: ReviewDecisionSchema,
});

/**
 * GET /api/extraction-sessions/[sessionId]/decisions - Get review decisions for session
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await dbConnect();

    const { sessionId } = await params;

    if (!sessionId) {
      return createErrorResponse("Session ID is required", 400);
    }

    const session = await ConceptExtractionSession.findOne(
      { id: sessionId },
      { reviewProgress: 1 }
    ).lean();

    if (!session) {
      return createErrorResponse("Extraction session not found", 404);
    }

    // Type assertion for lean query result
    const typedSession = session as unknown as IConceptExtractionSession;

    return createApiResponse({
      decisions: typedSession.reviewProgress.decisions,
      totalDecisions: typedSession.reviewProgress.decisions.length,
      reviewedCount: typedSession.reviewProgress.reviewedCount,
      totalConcepts: typedSession.reviewProgress.totalConcepts,
    });
  } catch (error) {
    console.error("Error fetching review decisions:", error);
    return createErrorResponse(
      "Failed to fetch review decisions",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * POST /api/extraction-sessions/[sessionId]/decisions - Add review decisions
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    await dbConnect();

    const { sessionId } = await params;

    if (!sessionId) {
      return createErrorResponse("Session ID is required", 400);
    }

    const body = await request.json();
    const validationResult = AddDecisionSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorResponse(
        "Invalid decision data",
        400,
        validationResult.error.errors
      );
    }

    const { decisions } = validationResult.data;

    // Get current session
    const sessionDoc = await ConceptExtractionSession.findOne({ id: sessionId });

    if (!sessionDoc) {
      return createErrorResponse("Extraction session not found", 404);
    }

    const session = sessionDoc.toObject() as IConceptExtractionSession;

    // Add decisions to existing ones
    const updatedDecisions = [...session.reviewProgress.decisions, ...decisions];
    const reviewedCount = updatedDecisions.length;

    const updatedSessionDoc = await ConceptExtractionSession.findOneAndUpdate(
      { id: sessionId },
      {
        $set: {
          "reviewProgress.decisions": updatedDecisions,
          "reviewProgress.reviewedCount": reviewedCount,
          "reviewProgress.lastReviewedAt": new Date(),
          updatedAt: new Date(),
          status:
            reviewedCount >= session.reviewProgress.totalConcepts
              ? "reviewed"
              : "in_review",
        },
      },
      { new: true, lean: true }
    );

    const updatedSession = updatedSessionDoc
      ? (updatedSessionDoc as unknown as IConceptExtractionSession)
      : null;

    return createApiResponse(
      {
        decisions: updatedSession?.reviewProgress.decisions,
        reviewedCount: updatedSession?.reviewProgress.reviewedCount,
        totalConcepts: updatedSession?.reviewProgress.totalConcepts,
      },
      "Review decisions added successfully"
    );
  } catch (error) {
    console.error("Error adding review decisions:", error);
    return createErrorResponse(
      "Failed to add review decisions",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * PATCH /api/extraction-sessions/[sessionId]/decisions - Update specific decision
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await dbConnect();

    const { sessionId } = await params;

    if (!sessionId) {
      return createErrorResponse("Session ID is required", 400);
    }

    const body = await request.json();
    const validationResult = UpdateDecisionSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorResponse(
        "Invalid update data",
        400,
        validationResult.error.errors
      );
    }

    const { decisionIndex, decision } = validationResult.data;

    // Get current session
    const sessionDoc = await ConceptExtractionSession.findOne({ id: sessionId });

    if (!sessionDoc) {
      return createErrorResponse("Extraction session not found", 404);
    }

    const session = sessionDoc.toObject() as IConceptExtractionSession;

    // Validate decision index
    if (decisionIndex >= session.reviewProgress.decisions.length) {
      return createErrorResponse("Decision index out of range", 400);
    }

    // Update specific decision
    const updatedDecisions = [...session.reviewProgress.decisions];
    updatedDecisions[decisionIndex] = decision;

    const updatedSessionDoc = await ConceptExtractionSession.findOneAndUpdate(
      { id: sessionId },
      {
        $set: {
          "reviewProgress.decisions": updatedDecisions,
          "reviewProgress.lastReviewedAt": new Date(),
          updatedAt: new Date(),
        },
      },
      { new: true, lean: true }
    );

    const updatedSession = updatedSessionDoc
      ? (updatedSessionDoc as unknown as IConceptExtractionSession)
      : null;

    return createApiResponse(
      {
        decisions: updatedSession?.reviewProgress.decisions,
        updatedIndex: decisionIndex,
      },
      "Review decision updated successfully"
    );
  } catch (error) {
    console.error("Error updating review decision:", error);
    return createErrorResponse(
      "Failed to update review decision",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}