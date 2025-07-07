// app/api/concepts/review/route.ts - FIXED VERSION
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

    if (decisions.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No decisions provided"
      }, { status: 400 });
    }

    const courseId = decisions[0].courseId;
    const conceptManager = new ConceptManager();
    const extractor = new ConceptExtractor();
    
    // Process all decisions and prepare for batch creation
    const approvedConcepts = [];
    const results = [];

    for (const decision of decisions) {
      try {
        if (decision.action === "approve") {
          approvedConcepts.push({
            concept: decision.extractedConcept,
            action: "create" as const,
          });
          results.push({
            success: true,
            conceptName: decision.extractedConcept.name,
            action: "approved_for_creation",
          });
        } else if (decision.action === "edit") {
          const editedConcept = {
            ...decision.extractedConcept,
            name: decision.editedConcept?.name || decision.extractedConcept.name,
            description: decision.editedConcept?.description || decision.extractedConcept.description,
            examples: decision.editedConcept?.examples || decision.extractedConcept.examples,
            suggestedDifficulty: decision.editedConcept?.difficulty || decision.extractedConcept.suggestedDifficulty,
          };
          
          approvedConcepts.push({
            concept: editedConcept,
            action: "create" as const,
          });
          results.push({
            success: true,
            conceptName: decision.extractedConcept.name,
            action: "approved_for_creation_with_edits",
          });
        } else if (decision.action === "link") {
          if (!decision.targetConceptId) {
            results.push({
              success: false,
              conceptName: decision.extractedConcept.name,
              error: "Target concept ID required for link action",
            });
            continue;
          }

          // Verify target concept exists
          const targetConcept = await conceptManager.getConcept(decision.targetConceptId);
          if (!targetConcept) {
            results.push({
              success: false,
              conceptName: decision.extractedConcept.name,
              error: `Target concept with ID ${decision.targetConceptId} not found`,
            });
            continue;
          }

          // Link to existing concept
          await conceptManager.linkConceptToCourse(
            decision.targetConceptId,
            courseId,
            decision.extractedConcept.confidence,
            decision.extractedConcept.sourceContent
          );

          results.push({
            success: true,
            conceptName: decision.extractedConcept.name,
            action: "linked",
            conceptId: decision.targetConceptId,
          });
        } else if (decision.action === "reject") {
          results.push({
            success: true,
            conceptName: decision.extractedConcept.name,
            action: "rejected",
          });
        }
      } catch (error) {
        results.push({
          success: false,
          conceptName: decision.extractedConcept.name,
          error: error instanceof Error ? error.message : "Processing failed",
        });
      }
    }

    // Now create all approved concepts in one batch operation
    let createdCount = 0;
    if (approvedConcepts.length > 0) {
      try {
        const creationResult = await extractor.applyReviewedConcepts(
          courseId,
          approvedConcepts
        );
        
        createdCount = creationResult.created + creationResult.merged;
        
        if (creationResult.errors.length > 0) {
          console.error("Concept creation errors:", creationResult.errors);
          // Update results with any creation errors
          creationResult.errors.forEach(error => {
            results.push({
              success: false,
              conceptName: "Unknown",
              error,
            });
          });
        }
      } catch (error) {
        console.error("Batch concept creation failed:", error);
        return NextResponse.json({
          success: false,
          error: "Failed to create approved concepts",
          details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      processedCount: successCount,
      createdCount,
      totalDecisions: decisions.length,
      results,
      message: `Processed ${successCount} decisions, created ${createdCount} concepts`
    }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid review data",
        details: error.errors,
      }, { status: 400 });
    }

    console.error("Review processing error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to process review decisions",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}