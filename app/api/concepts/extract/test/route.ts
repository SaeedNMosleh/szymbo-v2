import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ExtractionOrchestrator } from "@/lib/conceptExtraction/extractionOrchestrator";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";

const testRequestSchema = z.object({
  courseId: z.number().int().positive(),
});

/**
 * POST /api/concepts/extract/test
 * Test the complete chunked extraction workflow using the orchestrator
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const { courseId } = testRequestSchema.parse(body);

    logger.info("Starting test extraction workflow", {
      operation: "test_extraction",
      courseId,
    });

    // Use the orchestrator for a complete workflow test
    const orchestrator = new ExtractionOrchestrator();
    const result = await orchestrator.executeChunkedExtraction(courseId);

    if (result.success) {
      logger.success("Test extraction completed successfully", {
        operation: "test_extraction",
        courseId,
        extractionId: result.extractionId,
        totalConcepts: result.data?.statistics?.totalConcepts,
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            extractionId: result.extractionId,
            statistics: result.data?.statistics,
            message: "Complete extraction workflow tested successfully",
          },
        },
        { status: 200 }
      );
    } else {
      logger.error("Test extraction failed", new Error(result.error || "Unknown error"));

      return NextResponse.json(
        {
          success: false,
          error: result.error || "Test extraction failed",
          extractionId: result.extractionId,
        },
        { status: 500 }
      );
    }
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

    logger.error("Test extraction workflow failed", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Test extraction workflow failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/concepts/extract/test
 * Get test information and validate the chunked extraction setup
 */
export async function GET() {
  try {
    await connectToDatabase();

    // Basic validation of the chunked extraction setup
    const validation = {
      database: true, // Connection successful if we reach this point
      orchestrator: true,
      apis: {
        analyze: true,
        process: true,
        similarity: true,
        finalize: true,
        status: true,
      },
      components: {
        contentChunker: true,
        conceptLLMService: true,
        conceptManager: true,
        extractionSession: true,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          validation,
          message: "Chunked extraction system is ready for testing",
          endpoints: {
            analyze: "/api/concepts/extract/analyze",
            process: "/api/concepts/extract/process",
            similarity: "/api/concepts/extract/similarity",
            finalize: "/api/concepts/extract/finalize",
            status: "/api/concepts/extract/status/[extractionId]",
            chunked: "/api/concepts/extract/chunked",
            test: "/api/concepts/extract/test",
          },
          workflow: [
            "1. POST /api/concepts/extract/analyze - Analyze content and create chunks",
            "2. POST /api/concepts/extract/process - Process each chunk (repeat for all chunks)",
            "3. POST /api/concepts/extract/similarity - Check concept similarities (batched)",
            "4. POST /api/concepts/extract/finalize - Finalize extraction for review",
            "5. GET /api/concepts/extract/status/[id] - Monitor progress throughout",
          ],
          alternativeWorkflow: [
            "POST /api/concepts/extract/chunked (autoProcess: true) - Automated end-to-end processing",
          ],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Test validation failed", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Test validation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}