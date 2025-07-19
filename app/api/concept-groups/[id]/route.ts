import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManagerEnhanced } from "@/lib/conceptExtraction/conceptManagerEnhanced";
import { z } from "zod";

// Request validation schema for adding concepts to group
const addConceptsSchema = z.object({
  conceptIds: z.array(z.string()).min(1),
});

// Request validation schema for updating group
const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  groupType: z.enum(["vocabulary", "grammar", "mixed"]).optional(),
  level: z.number().min(1).max(5).optional(),
  difficulty: z.string().optional(),
});

// Request validation schema for removing concepts from group
const removeConceptsSchema = z.object({
  conceptIds: z.array(z.string()).min(1),
});

// GET /api/concept-groups/[id] - Get concepts in a group with optional cascading
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    
    const includeChildren = searchParams.get("includeChildren") === "true";
    const maxDepth = parseInt(searchParams.get("maxDepth") || "5");

    const conceptManager = new ConceptManagerEnhanced();

    // Get concepts in the group
    const concepts = await conceptManager.getConceptsInGroup(
      resolvedParams.id,
      includeChildren,
      maxDepth
    );

    // Get group details
    const ConceptGroup = (await import("@/datamodels/conceptGroup.model")).default;
    const group = await ConceptGroup.findOne({ id: resolvedParams.id, isActive: true });

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = addConceptsSchema.parse(body);

    const conceptManager = new ConceptManagerEnhanced();

    // Add concepts to the group
    await conceptManager.addConceptsToGroup(resolvedParams.id, validatedData.conceptIds);

    // Get updated group information
    const concepts = await conceptManager.getConceptsInGroup(resolvedParams.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          groupId: resolvedParams.id,
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

// PUT /api/concept-groups/[id] - Update group details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateGroupSchema.parse(body);

    const ConceptGroup = (await import("@/datamodels/conceptGroup.model")).default;

    // Check if group exists
    const existingGroup = await ConceptGroup.findOne({ 
      id: resolvedParams.id, 
      isActive: true 
    });

    if (!existingGroup) {
      return NextResponse.json(
        {
          success: false,
          error: "Concept group not found",
        },
        { status: 404 }
      );
    }

    // Update the group
    const updatedGroup = await ConceptGroup.findOneAndUpdate(
      { id: resolvedParams.id, isActive: true },
      { 
        ...validatedData,
        lastUpdated: new Date()
      },
      { new: true }
    );

    return NextResponse.json(
      {
        success: true,
        data: updatedGroup.toObject(),
        message: "Group updated successfully",
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

    console.error("Error updating group:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update group",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/concept-groups/[id] - Delete group or remove concepts from group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const body = await request.json();

    // If conceptIds are provided, remove specific concepts from group
    if (body.conceptIds) {
      const validatedData = removeConceptsSchema.parse(body);
      const conceptManager = new ConceptManagerEnhanced();

      // Remove concepts from the group
      await conceptManager.removeConceptsFromGroup(resolvedParams.id, validatedData.conceptIds);

      // Get updated group information
      const concepts = await conceptManager.getConceptsInGroup(resolvedParams.id);

      return NextResponse.json(
        {
          success: true,
          data: {
            groupId: resolvedParams.id,
            removedConcepts: validatedData.conceptIds.length,
            totalConcepts: concepts.length,
          },
          message: "Concepts removed from group successfully",
        },
        { status: 200 }
      );
    } else {
      // Delete the entire group
      const ConceptGroup = (await import("@/datamodels/conceptGroup.model")).default;

      const deletedGroup = await ConceptGroup.findOneAndUpdate(
        { id: resolvedParams.id, isActive: true },
        { isActive: false, lastUpdated: new Date() },
        { new: true }
      );

      if (!deletedGroup) {
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
          data: { groupId: resolvedParams.id },
          message: "Group deleted successfully",
        },
        { status: 200 }
      );
    }
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

    console.error("Error deleting group or removing concepts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete group or remove concepts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}