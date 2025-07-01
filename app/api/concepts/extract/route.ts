import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptExtractor } from "@/lib/conceptExtraction/conceptExtractor";
import { z } from "zod";

const extractRequestSchema = z.object({
  courseId: z.number().int().positive(),
});

// POST /api/concepts/extract - Extract concepts from course
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const { courseId } = extractRequestSchema.parse(body);

    const extractor = new ConceptExtractor();
    const result = await extractor.extractConceptsFromCourse(courseId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Concept extraction failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        extractionId: result.extractionId,
        message: `Extracted ${result.data?.totalExtracted || 0} concepts`,
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

    console.error("Concept extraction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Concept extraction failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/concepts/extract - Get extraction status or results
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    // Extract query parameters with validation
    const courseId = parseInt(searchParams.get("courseId") || "");

    if (isNaN(courseId) || courseId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid courseId parameter",
        },
        { status: 400 }
      );
    }

    const extractor = new ConceptExtractor();
    const reviewData = await extractor.prepareReviewData(courseId);

    if (!reviewData) {
      return NextResponse.json(
        {
          success: false,
          error: "No extraction data found for this course",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: reviewData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting extraction data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get extraction data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
