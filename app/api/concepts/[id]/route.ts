import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManager } from "@/lib/conceptExtraction/conceptManager";
import { z } from "zod";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

// Update concept schema (partial)
const updateConceptSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z
    .enum([ConceptCategory.GRAMMAR, ConceptCategory.VOCABULARY])
    .optional(),
  description: z.string().min(1).max(500).optional(),
  examples: z.array(z.string()).max(30).optional(),
  difficulty: z
    .enum([
      QuestionLevel.A1,
      QuestionLevel.A2,
      QuestionLevel.B1,
      QuestionLevel.B2,
      QuestionLevel.C1,
      QuestionLevel.C2,
    ])
    .optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/concepts/[id] - Fetch specific concept
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const conceptManager = new ConceptManager();

    // Await the params
    const { id } = await params;

    const concept = await conceptManager.getConcept(id);

    if (!concept) {
      return NextResponse.json(
        {
          success: false,
          error: "Concept not found",
        },
        { status: 404 }
      );
    }

    // Include related data
    const relatedCourses = await conceptManager.getCoursesForConcept(id);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...concept,
          relatedCourses,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching concept:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch concept",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT /api/concepts/[id] - Update concept
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Await the params
    const { id } = await params;

    // Validate partial update data
    const validatedData = updateConceptSchema.parse(body);

    const conceptManager = new ConceptManager();

    // Check if concept exists
    const existingConcept = await conceptManager.getConcept(id);
    if (!existingConcept) {
      return NextResponse.json(
        {
          success: false,
          error: "Concept not found",
        },
        { status: 404 }
      );
    }

    const updatedConcept = await conceptManager.updateConcept(
      id,
      validatedData
    );

    return NextResponse.json(
      {
        success: true,
        data: updatedConcept,
      },
      { status: 200 }
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

    console.error("Error updating concept:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update concept",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/concepts/[id] - Soft delete concept
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const conceptManager = new ConceptManager();

    // Await the params
    const { id } = await params;

    // Check if concept exists
    const existingConcept = await conceptManager.getConcept(id);
    if (!existingConcept) {
      return NextResponse.json(
        {
          success: false,
          error: "Concept not found",
        },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await conceptManager.updateConcept(id, { isActive: false });

    return NextResponse.json(
      {
        success: true,
        message: "Concept deactivated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting concept:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete concept",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
