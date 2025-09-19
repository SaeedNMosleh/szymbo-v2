import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { createContentChunker } from "@/lib/conceptExtraction/contentChunker";
import Course from "@/datamodels/course.model";
import ConceptExtractionSession from "@/datamodels/conceptExtractionSession.model";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/lib/utils/logger";

const analyzeRequestSchema = z.object({
  courseId: z.number().int().positive(),
});

/**
 * POST /api/concepts/extract/analyze
 * Analyze course content and create extraction session with chunking strategy
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const { courseId } = analyzeRequestSchema.parse(body);

    logger.info("Starting content analysis", {
      operation: "content_analysis",
      courseId,
    });

    // Fetch course data
    const course = await Course.findOne({ courseId });
    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: `Course with ID ${courseId} not found`,
        },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!course.notes || !course.practice || !course.keywords) {
      return NextResponse.json(
        {
          success: false,
          error: `Course ${courseId} is missing required fields (notes, practice, or keywords)`,
        },
        { status: 400 }
      );
    }

    // Check if there's already an active extraction session
    const existingSession = await ConceptExtractionSession.findOne({
      courseId,
      status: { $in: ["analyzing", "extracting", "similarity_checking"] },
    });

    if (existingSession) {
      return NextResponse.json(
        {
          success: false,
          error: "Extraction already in progress for this course",
          extractionId: existingSession.id,
        },
        { status: 409 }
      );
    }

    // Analyze content and create chunking strategy
    const chunker = createContentChunker();
    const analysis = await chunker.analyzeCourseContent(course.toObject());

    // Create new extraction session
    const extractionId = uuidv4();
    const sessionData = {
      id: extractionId,
      courseId,
      courseName: `Course ${courseId} - ${course.keywords.join(", ")}`,
      extractionDate: new Date(),
      status: "analyzing" as const,
      extractedConcepts: [],
      similarityMatches: [],
      reviewProgress: {
        totalConcepts: 0,
        reviewedCount: 0,
        decisions: [],
        isDraft: true,
      },
      extractionProgress: {
        phase: "analyzing" as const,
        totalChunks: analysis.recommendedChunks.length,
        processedChunks: 0,
        totalConcepts: analysis.recommendedChunks.reduce(
          (sum, chunk) => sum + chunk.estimatedConcepts,
          0
        ),
        extractedConcepts: 0,
        similarityChecked: 0,
        estimatedTimeRemaining: analysis.estimatedProcessingTime,
        currentOperation: "Content analysis completed",
        chunks: analysis.recommendedChunks,
        lastUpdated: new Date(),
      },
      newTagsCreated: [],
      extractionMetadata: {
        llmModel: "gpt-4.1-nano", // Will be updated during actual extraction
        totalProcessingTime: 0,
        extractionConfidence: 0,
        sourceContentLength: analysis.totalContentLength,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save session to database
    await ConceptExtractionSession.create(sessionData);

    logger.success("Content analysis completed", {
      operation: "content_analysis",
      courseId,
      extractionId,
      totalChunks: analysis.recommendedChunks.length,
      estimatedConcepts: analysis.recommendedChunks.reduce(
        (sum, chunk) => sum + chunk.estimatedConcepts,
        0
      ),
      estimatedProcessingTime: analysis.estimatedProcessingTime,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          extractionId,
          analysis: {
            totalChunks: analysis.recommendedChunks.length,
            estimatedConcepts: analysis.recommendedChunks.reduce(
              (sum, chunk) => sum + chunk.estimatedConcepts,
              0
            ),
            estimatedProcessingTime: analysis.estimatedProcessingTime,
            contentLength: analysis.totalContentLength,
            analysisMetadata: analysis.analysisMetadata,
          },
        },
        message: `Content analyzed: ${analysis.recommendedChunks.length} chunks, ~${analysis.recommendedChunks.reduce(
          (sum, chunk) => sum + chunk.estimatedConcepts,
          0
        )} concepts estimated`,
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

    logger.error("Content analysis failed", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Content analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}