import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ExtractionOrchestrator } from "@/lib/conceptExtraction/extractionOrchestrator";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";

const chunkedExtractionRequestSchema = z.object({
  courseId: z.number().int().positive(),
  autoProcess: z.boolean().optional().default(false), // Whether to automatically process all chunks
});

/**
 * POST /api/concepts/extract/chunked
 * Start chunked concept extraction workflow
 *
 * This endpoint orchestrates the entire chunked extraction process:
 * 1. Analyze content and create chunks
 * 2. Process each chunk to extract concepts
 * 3. Perform similarity checking
 * 4. Finalize results
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const { courseId, autoProcess } = chunkedExtractionRequestSchema.parse(body);

    logger.info("Starting chunked concept extraction", {
      operation: "chunked_extraction_start",
      courseId,
      autoProcess,
    });

    // Step 1: Analyze content and create extraction session
    const analyzeResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/concepts/extract/analyze`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      }
    );

    if (!analyzeResponse.ok) {
      const analyzeError = await analyzeResponse.json();
      return NextResponse.json(
        {
          success: false,
          error: "Content analysis failed",
          details: analyzeError.error,
        },
        { status: analyzeResponse.status }
      );
    }

    const analyzeResult = await analyzeResponse.json();
    const extractionId = analyzeResult.data.extractionId;

    logger.info("Content analysis completed", {
      operation: "chunked_extraction_analyze",
      courseId,
      extractionId,
      totalChunks: analyzeResult.data.analysis.totalChunks,
      estimatedConcepts: analyzeResult.data.analysis.estimatedConcepts,
    });

    // If autoProcess is true, use the orchestrator for reliable processing
    if (autoProcess) {
      try {
        // Use the orchestrator for complete workflow
        const orchestrator = new ExtractionOrchestrator();
        const orchestratorResult = await orchestrator.executeChunkedExtraction(courseId);

        if (orchestratorResult.success) {
          return NextResponse.json(
            {
              success: true,
              data: {
                extractionId: orchestratorResult.extractionId,
                courseId,
                statistics: orchestratorResult.data?.statistics,
                autoProcessing: true,
                completed: true,
              },
              message: `Extraction completed successfully! ${orchestratorResult.data?.statistics?.totalConcepts || 0} concepts extracted.`,
            },
            { status: 200 }
          );
        } else {
          return NextResponse.json(
            {
              success: false,
              error: orchestratorResult.error || "Orchestrated extraction failed",
              extractionId: orchestratorResult.extractionId,
            },
            { status: 500 }
          );
        }
      } catch (orchestratorError) {
        logger.error("Orchestrator execution failed", orchestratorError as Error);
        return NextResponse.json(
          {
            success: false,
            error: "Orchestrated extraction failed",
            details: orchestratorError instanceof Error ? orchestratorError.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    // Manual processing mode - just return analysis for step-by-step processing
    return NextResponse.json(
      {
        success: true,
        data: {
          extractionId,
          courseId,
          analysis: analyzeResult.data.analysis,
          autoProcessing: false,
          nextSteps: ["Call process endpoint for each chunk", "Call similarity endpoint", "Call finalize endpoint"],
        },
        message: `Content analyzed into ${analyzeResult.data.analysis.totalChunks} chunks. Use individual endpoints to process.`,
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

    logger.error("Chunked extraction failed", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Chunked extraction failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}