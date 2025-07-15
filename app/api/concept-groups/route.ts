import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManagerEnhanced } from "@/lib/conceptExtraction/conceptManagerEnhanced";
import { z } from "zod";
import { QuestionLevel } from "@/lib/enum";

// Request validation schemas
const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  groupType: z.enum(["vocabulary", "grammar", "mixed"]),
  level: z.number().min(1).max(5),
  difficulty: z.enum([
    QuestionLevel.A1,
    QuestionLevel.A2,
    QuestionLevel.B1,
    QuestionLevel.B2,
    QuestionLevel.C1,
    QuestionLevel.C2,
  ]),
  parentGroup: z.string().optional(),
  memberConcepts: z.array(z.string()).optional(),
});

const addConceptsSchema = z.object({
  groupId: z.string().min(1),
  conceptIds: z.array(z.string()).min(1),
});

// GET /api/concept-groups - Fetch concept groups with hierarchy
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    
    const groupType = searchParams.get("groupType");
    const level = searchParams.get("level");
    const includeHierarchy = searchParams.get("includeHierarchy") !== "false";

    const conceptManager = new ConceptManagerEnhanced();
    
    // Build query
    const query: any = { isActive: true };
    if (groupType) query.groupType = groupType;
    if (level) query.level = parseInt(level);

    // Import ConceptGroup model directly since it's not in conceptManager
    const ConceptGroup = (await import("@/datamodels/conceptGroup.model")).default;
    const groups = await ConceptGroup.find(query).sort({ level: 1, name: 1 });

    const groupsData = groups.map(group => group.toObject());

    // If hierarchy requested, build tree structure
    if (includeHierarchy) {
      const hierarchyData = buildHierarchy(groupsData);
      return NextResponse.json(
        {
          success: true,
          data: hierarchyData,
          total: groupsData.length,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: groupsData,
        total: groupsData.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching concept groups:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch concept groups",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/concept-groups - Create new concept group
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const validatedData = createGroupSchema.parse(body);

    const conceptManager = new ConceptManagerEnhanced();

    // Create the concept group
    const group = await conceptManager.createConceptGroup(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: group,
        message: "Concept group created successfully",
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

    console.error("Error creating concept group:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create concept group",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to build hierarchy tree structure
function buildHierarchy(groups: any[]): any[] {
  const groupMap = new Map(groups.map(g => [g.id, { ...g, children: [] }]));
  const rootGroups: any[] = [];

  for (const group of groups) {
    const groupWithChildren = groupMap.get(group.id)!;
    
    if (group.parentGroup && groupMap.has(group.parentGroup)) {
      // Add to parent's children
      const parent = groupMap.get(group.parentGroup)!;
      parent.children.push(groupWithChildren);
    } else {
      // This is a root group
      rootGroups.push(groupWithChildren);
    }
  }

  return rootGroups;
}