import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManagerEnhanced } from "@/lib/conceptExtraction/conceptManagerEnhanced";
import { z } from "zod";

// Request validation schema for adding concepts to group
const addConceptsSchema = z.object({
  conceptIds: z.array(z.string()).min(1),
});

// GET /api/concept-groups/[id] - Get concepts in a group with optional cascading
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    
    const includeChildren = searchParams.get("includeChildren") === "true";
    const maxDepth = parseInt(searchParams.get("maxDepth") || "5");

    const conceptManager = new ConceptManagerEnhanced();

    // Get concepts in the group
    const concepts = await conceptManager.getConceptsInGroup(
      params.id,
      includeChildren,
      maxDepth
    );

    // Get group details
    const ConceptGroup = (await import("@/datamodels/conceptGroup.model")).default;
    const group = await ConceptGroup.findOne({ id: params.id, isActive: true });

    if (!group) {
      return NextResponse.json(
        {
          success: false,
          error: "Concept group not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          group: group.toObject(),
          concepts,
          total: concepts.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching concepts in group:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch concepts in group",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/concept-groups/[id] - Add concepts to a group
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const validatedData = addConceptsSchema.parse(body);

    const conceptManager = new ConceptManagerEnhanced();

    // Add concepts to the group
    await conceptManager.addConceptsToGroup(params.id, validatedData.conceptIds);

    // Get updated group information
    const concepts = await conceptManager.getConceptsInGroup(params.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          groupId: params.id,
          addedConcepts: validatedData.conceptIds.length,
          totalConcepts: concepts.length,
        },
        message: "Concepts added to group successfully",
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

    console.error("Error adding concepts to group:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add concepts to group",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}