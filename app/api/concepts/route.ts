import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManager } from "@/lib/conceptExtraction/conceptManager";
import { z } from "zod";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

// Request validation schemas
const createConceptSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum([ConceptCategory.GRAMMAR, ConceptCategory.VOCABULARY]),
  description: z.string().min(1).max(500),
  examples: z.array(z.string()).max(30),
  difficulty: z.enum([
    QuestionLevel.A1,
    QuestionLevel.A2,
    QuestionLevel.B1,
    QuestionLevel.B2,
    QuestionLevel.C1,
    QuestionLevel.C2,
  ]),
});

// GET /api/concepts - Fetch all active concepts with pagination
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const conceptManager = new ConceptManager();

    // Check if this is a course-specific request
    const courseId = searchParams.get("courseId");
    if (courseId) {
      console.log(`🔍 CONCEPTS API: Getting concepts for course ${courseId}`);
      const concepts = await conceptManager.getConceptsForCourse(parseInt(courseId));
      console.log(`📊 CONCEPTS API: Found ${concepts.length} concepts for course ${courseId}`);
      
      return NextResponse.json(
        {
          success: true,
          data: concepts,
        },
        { status: 200 }
      );
    }

    // Extract query parameters with validation for regular requests
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20"))
    );
    const category = searchParams.get("category") as ConceptCategory | null;
    const isActive = searchParams.get("isActive") !== "false"; // Default to true

    // Use the new pagination method
    const concepts = await conceptManager.getConceptsPaginated({
      page,
      limit,
      category,
      isActive,
    });

    if (!concepts.success) {
      return NextResponse.json(
        {
          success: false,
          error: concepts.error || "Failed to fetch concepts",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: concepts.data,
        pagination: {
          page,
          limit,
          total: concepts.total,
          pages: Math.ceil(concepts.total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching concepts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch concepts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/concepts - Create new concept
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const validatedData = createConceptSchema.parse(body);

    const conceptManager = new ConceptManager();

    // Check for duplicates
    const isUnique = await conceptManager.validateConceptUniqueness(
      validatedData.name,
      validatedData.category
    );

    if (!isUnique) {
      return NextResponse.json(
        {
          success: false,
          error: "Concept with this name already exists in the category",
        },
        { status: 409 }
      );
    }

    const concept = await conceptManager.createConcept(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: concept,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Error creating concept:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create concept",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
