import { NextRequest } from "next/server";
import { z } from "zod";
import { ExtractionSessionCleanupService } from "@/lib/services/extractionSessionCleanup";
import { createApiResponse, createErrorResponse } from "@/lib/utils/apiResponse";
import dbConnect from "@/lib/dbConnect";

// Schema for cleanup configuration
const CleanupConfigSchema = z.object({
  archiveArchivedOlderThan: z.number().min(1).max(365).optional(),
  removeStaleOlderThan: z.number().min(1).max(30).optional(),
  archiveReviewedOlderThan: z.number().min(1).max(365).optional(),
  dryRun: z.boolean().optional().default(false)
});

/**
 * GET /api/extraction-sessions/cleanup - Get cleanup statistics
 */
export async function GET() {
  try {
    await dbConnect();

    const stats = await ExtractionSessionCleanupService.getCleanupStats();

    return createApiResponse({
      stats,
      recommendations: {
        archivedCanBeDeleted: stats.archivedSessions,
        staleCanBeDeleted: stats.staleSessions,
        reviewedCanBeArchived: stats.oldReviewedSessions
      }
    });

  } catch (error) {
    console.error("Error fetching cleanup stats:", error);
    return createErrorResponse(
      "Failed to fetch cleanup statistics",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * POST /api/extraction-sessions/cleanup - Perform cleanup
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validationResult = CleanupConfigSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorResponse(
        "Invalid cleanup configuration",
        400,
        validationResult.error.errors
      );
    }

    const { dryRun, ...config } = validationResult.data;

    if (dryRun) {
      // Return what would be cleaned up without actually doing it
      const stats = await ExtractionSessionCleanupService.getCleanupStats();
      
      return createApiResponse({
        dryRun: true,
        wouldCleanup: {
          archivedDeleted: stats.archivedSessions,
          staleDeleted: stats.staleSessions,
          reviewedArchived: stats.oldReviewedSessions
        },
        config
      }, "Dry run completed - no data was modified");
    }

    // Perform actual cleanup
    const results = await ExtractionSessionCleanupService.performFullCleanup(config);

    return createApiResponse({
      dryRun: false,
      results,
      config,
      totalOperations: results.archivedDeleted + results.staleDeleted + results.reviewedArchived
    }, "Cleanup completed successfully");

  } catch (error) {
    console.error("Error performing cleanup:", error);
    return createErrorResponse(
      "Failed to perform cleanup",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}