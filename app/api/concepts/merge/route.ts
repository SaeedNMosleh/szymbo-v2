import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManagerEnhanced } from "@/lib/conceptExtraction/conceptManagerEnhanced";
import { z } from "zod";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

// Request validation schema for concept merging
const mergeConceptsSchema = z.object({
  sourceConceptIds: z.array(z.string()).min(2, "At least 2 concepts required for merging"),
  targetConceptData: z.object({
    name: z.string().min(1).max(100),
    category: z.enum([ConceptCategory.GRAMMAR, ConceptCategory.VOCABULARY]),
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
    ]),
    vocabularyData: z.object({
      word: z.string(),
      translation: z.string(),
      partOfSpeech: z.string(),
      gender: z.string().optional(),
      pluralForm: z.string().optional(),
      pronunciation: z.string().optional(),
    }).optional(),
  }),
  preserveHistory: z.boolean().default(true),
});

// POST /api/concepts/merge - Merge multiple concepts into one
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const validatedData = mergeConceptsSchema.parse(body);

    const conceptManager = new ConceptManagerEnhanced();

    // Perform the merge operation
    const mergedConcept = await conceptManager.mergeConcepts(
      validatedData.sourceConceptIds,
      validatedData.targetConceptData,
      validatedData.preserveHistory
    );

    return NextResponse.json(
      {
        success: true,
        data: mergedConcept,
        message: `Successfully merged ${validatedData.sourceConceptIds.length} concepts`,
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

    console.error("Error merging concepts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to merge concepts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}