import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManagerEnhanced } from "@/lib/conceptExtraction/conceptManagerEnhanced";
import { z } from "zod";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

// Request validation schema for concept splitting
const splitConceptSchema = z.object({
  sourceConceptId: z.string().min(1, "Source concept ID is required"),
  subconceptsData: z.array(z.object({
    name: z.string().min(1).max(100),
    category: z.enum([ConceptCategory.GRAMMAR, ConceptCategory.VOCABULARY]).optional(),
    description: z.string().min(1).max(500),
    examples: z.array(z.string()).max(10).optional(),
    tags: z.array(z.string()).optional(),
    difficulty: z.enum([
      QuestionLevel.A1,
      QuestionLevel.A2,
      QuestionLevel.B1,
      QuestionLevel.B2,
      QuestionLevel.C1,
      QuestionLevel.C2,
    ]).optional(),
    vocabularyData: z.object({
      word: z.string(),
      translation: z.string(),
      partOfSpeech: z.string(),
      gender: z.string().optional(),
      pluralForm: z.string().optional(),
      pronunciation: z.string().optional(),
    }).optional(),
  })).min(2, "At least 2 subconcepts required for splitting"),
  preserveOriginal: z.boolean().default(false),
});

// POST /api/concepts/split - Split a concept into multiple subconcepts
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const validatedData = splitConceptSchema.parse(body);

    const conceptManager = new ConceptManagerEnhanced();

    // Perform the split operation
    const subconcepts = await conceptManager.splitConcept(
      validatedData.sourceConceptId,
      validatedData.subconceptsData,
      validatedData.preserveOriginal
    );

    return NextResponse.json(
      {
        success: true,
        data: subconcepts,
        message: `Successfully split concept into ${subconcepts.length} subconcepts`,
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

    console.error("Error splitting concept:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to split concept",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}