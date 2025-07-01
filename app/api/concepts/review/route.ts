import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManager } from "@/lib/conceptExtraction/conceptManager";
import { ConceptExtractor } from "@/lib/conceptExtraction/conceptExtractor";
import { z } from "zod";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

// Define schemas for the review decision API
const extractedConceptSchema = z.object({
  name: z.string(),
  category: z.enum([ConceptCategory.GRAMMAR, ConceptCategory.VOCABULARY]),
  description: z.string(),
  examples: z.array(z.string()),
  sourceContent: z.string(),
  confidence: z.number().min(0).max(1),
  suggestedDifficulty: z
    .enum([
      QuestionLevel.A1,
      QuestionLevel.A2,
      QuestionLevel.B1,
      QuestionLevel.B2,
      QuestionLevel.C1,
      QuestionLevel.C2,
    ])
    .optional(),
});

const reviewDecisionSchema = z.object({
  action: z.enum(["approve", "link", "edit", "reject"]),
  extractedConcept: extractedConceptSchema,
  targetConceptId: z.string().optional(), // for link action
  editedConcept: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      examples: z.array(z.string()).optional(),
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
    })
    .optional(), // for edit action
  courseId: z.number().int().positive(),
});

const batchReviewSchema = z.object({
  decisions: z.array(reviewDecisionSchema),
});

// POST /api/concepts/review - Process human review decisions
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate the request body
    const { decisions } = batchReviewSchema.parse(body);

    const conceptManager = new ConceptManager();
    const results = [];
    let processedCount = 0;

    for (const decision of decisions) {
      try {
        const result = await processReviewDecision(decision, conceptManager);
        results.push(result);
        if (result.success) processedCount++;
      } catch (error) {
        results.push({
          success: false,
          conceptName: decision.extractedConcept.name,
          error: error instanceof Error ? error.message : "Processing failed",
        });
      }
    }

    // Update course extraction status if all decisions for a course are processed
    if (processedCount > 0 && decisions.length > 0) {
      const courseId = decisions[0].courseId;
      const extractor = new ConceptExtractor();

      // Create the approved concepts array manually to satisfy type requirements
      // This is a workaround for type compatibility issues
      const manuallyApprovedConcepts = decisions
        .filter((d) => d.action === "approve" || d.action === "edit")
        .map((d) => {
          // Create a properly typed object for the extractor
          return {
            concept: {
              name: d.extractedConcept.name,
              category: d.extractedConcept.category,
              description: d.extractedConcept.description,
              examples: d.extractedConcept.examples,
              sourceContent: d.extractedConcept.sourceContent,
              confidence: d.extractedConcept.confidence,
              // Ensure suggestedDifficulty is always defined
              suggestedDifficulty:
                d.extractedConcept.suggestedDifficulty || QuestionLevel.A1,
            },
            action:
              d.action === "link" ? ("merge" as const) : ("create" as const),
            mergeWithId: d.targetConceptId,
          };
        });

      if (manuallyApprovedConcepts.length > 0) {
        await extractor.applyReviewedConcepts(
          courseId,
          manuallyApprovedConcepts
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        processedCount,
        totalDecisions: decisions.length,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid review data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Review processing error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process review decisions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Process an individual review decision
 * @param decision The review decision
 * @param conceptManager The concept manager instance
 * @returns Result of the processing
 */
async function processReviewDecision(
  decision: z.infer<typeof reviewDecisionSchema>,
  conceptManager: ConceptManager
) {
  const { action, extractedConcept, targetConceptId, editedConcept, courseId } =
    decision;

  switch (action) {
    case "approve": {
      // Create new concept from extracted data
      const newConcept = await conceptManager.createConcept({
        name: extractedConcept.name,
        category: extractedConcept.category,
        description: extractedConcept.description,
        examples: extractedConcept.examples,
        difficulty: extractedConcept.suggestedDifficulty || QuestionLevel.A1,
        confidence: extractedConcept.confidence,
        createdFrom: [courseId.toString()],
      });

      // Link to course
      await conceptManager.linkConceptToCourse(
        newConcept.id,
        courseId,
        extractedConcept.confidence,
        extractedConcept.sourceContent
      );

      return {
        success: true,
        conceptName: extractedConcept.name,
        action: "created",
        conceptId: newConcept.id,
      };
    }

    case "link": {
      // Link extracted concept to existing concept
      if (!targetConceptId) {
        throw new Error("Target concept ID required for link action");
      }

      // Verify target concept exists
      const targetConcept = await conceptManager.getConcept(targetConceptId);
      if (!targetConcept) {
        throw new Error(`Target concept with ID ${targetConceptId} not found`);
      }

      await conceptManager.linkConceptToCourse(
        targetConceptId,
        courseId,
        extractedConcept.confidence,
        extractedConcept.sourceContent
      );

      return {
        success: true,
        conceptName: extractedConcept.name,
        action: "linked",
        conceptId: targetConceptId,
      };
    }

    case "edit": {
      // Create concept with edited data
      const editedConceptData = {
        name: editedConcept?.name || extractedConcept.name,
        category: extractedConcept.category,
        description: editedConcept?.description || extractedConcept.description,
        examples: editedConcept?.examples || extractedConcept.examples,
        difficulty:
          editedConcept?.difficulty ||
          extractedConcept.suggestedDifficulty ||
          QuestionLevel.A1,
        confidence: extractedConcept.confidence,
        createdFrom: [courseId.toString()],
      };

      const editedConceptResult =
        await conceptManager.createConcept(editedConceptData);

      await conceptManager.linkConceptToCourse(
        editedConceptResult.id,
        courseId,
        extractedConcept.confidence,
        extractedConcept.sourceContent
      );

      return {
        success: true,
        conceptName: extractedConcept.name,
        action: "edited",
        conceptId: editedConceptResult.id,
      };
    }

    case "reject":
      // Do nothing, just log the rejection
      return {
        success: true,
        conceptName: extractedConcept.name,
        action: "rejected",
      };

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
