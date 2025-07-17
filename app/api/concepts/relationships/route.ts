import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManagerEnhanced } from "@/lib/conceptExtraction/conceptManagerEnhanced";
import { z } from "zod";

// Request validation schemas
const createRelationshipSchema = z.object({
  fromConceptId: z.string().min(1),
  toConceptId: z.string().min(1),
  relationshipType: z.enum([
    'prerequisite',
    'related', 
    'similar',
    'opposite',
    'parent-child',
    'example-of',
    'progression'
  ]),
  strength: z.number().min(0).max(1).default(0.5),
  description: z.string().optional(),
  evidence: z.array(z.string()).optional(),
  bidirectional: z.boolean().default(false),
});

const getRelationshipsSchema = z.object({
  conceptId: z.string().min(1),
  includeIncoming: z.boolean().default(true),
});

// GET /api/concepts/relationships - Get concept relationship graph
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    
    const queryParams = {
      conceptId: searchParams.get("conceptId"),
      includeIncoming: searchParams.get("includeIncoming") !== "false",
    };

    // Validate query parameters
    if (!queryParams.conceptId) {
      return NextResponse.json(
        {
          success: false,
          error: "conceptId query parameter is required",
        },
        { status: 400 }
      );
    }

    const validatedQuery = getRelationshipsSchema.parse(queryParams);
    const conceptManager = new ConceptManagerEnhanced();

    // Get relationships for the concept
    const relationships = await conceptManager.getConceptRelationships(
      validatedQuery.conceptId,
      validatedQuery.includeIncoming
    );

    // Get the concept details for context
    const concept = await conceptManager.getConcept(validatedQuery.conceptId);
    if (!concept) {
      return NextResponse.json(
        {
          success: false,
          error: "Concept not found",
        },
        { status: 404 }
      );
    }

    // Fetch related concept details for richer response
    const relatedConceptIds = Array.from(new Set([
      ...relationships.map(r => r.fromConceptId),
      ...relationships.map(r => r.toConceptId)
    ])).filter(id => id !== validatedQuery.conceptId);

    const relatedConcepts = await Promise.all(
      relatedConceptIds.map(id => conceptManager.getConcept(id))
    );

    const relatedConceptsMap = relatedConcepts
      .filter(c => c !== null)
      .reduce((acc, concept) => {
        acc[concept!.id] = concept;
        return acc;
      }, {} as Record<string, unknown>);

    return NextResponse.json(
      {
        success: true,
        data: {
          concept,
          relationships,
          relatedConcepts: relatedConceptsMap,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching concept relationships:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch relationships",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/concepts/relationships - Create a new relationship
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const validatedData = createRelationshipSchema.parse(body);

    const conceptManager = new ConceptManagerEnhanced();

    // Create the relationship
    const relationship = await conceptManager.createConceptRelationship({
      ...validatedData,
      createdBy: 'user', // Assume user-created for manual relationships
    });

    return NextResponse.json(
      {
        success: true,
        data: relationship,
        message: "Relationship created successfully",
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

    console.error("Error creating relationship:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create relationship",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}