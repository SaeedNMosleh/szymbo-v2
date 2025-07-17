import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManagerEnhanced } from "@/lib/conceptExtraction/conceptManagerEnhanced";
import { ConceptLLMService } from "@/lib/conceptExtraction/conceptLLM";
import { IConcept } from "@/datamodels/concept.model";
import { RelationshipType } from "@/datamodels/conceptRelationship.model";
import { z } from "zod";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

// Types for change objects
interface ChangeBase {
  conceptId: string;
  conceptName: string;
  operation: string;
  oldValue: unknown;
  applied: boolean;
  error?: string;
}

interface TagAssignmentChange extends ChangeBase {
  operation: 'tag-assignment';
  oldValue: string[];
  newValue: string[];
}

interface CategoryChange extends ChangeBase {
  operation: 'category-change';
  newValue: ConceptCategory;
}

interface DifficultyChange extends ChangeBase {
  operation: 'difficulty-change';
  newValue: QuestionLevel;
}

interface RelationshipSuggestion {
  fromConceptId: string;
  fromConceptName: string;
  toConceptId: string;
  toConceptName: string;
  relationshipType: string;
  strength: number;
  reasoning: string;
  applied: boolean;
  error?: string;
}

// Type for bulk operation results
interface BulkOperationResult {
  operation: string;
  conceptsProcessed: number;
  preview?: boolean;
  changes?: (TagAssignmentChange | CategoryChange | DifficultyChange)[];
  suggestions?: RelationshipSuggestion[];
}

// Request validation schemas for bulk operations
const bulkUpdateSchema = z.object({
  operation: z.enum(['tag-assignment', 'category-change', 'difficulty-change', 'relationship-suggestions']),
  conceptIds: z.array(z.string()).min(1),
  parameters: z.object({
    // For tag assignment
    tags: z.array(z.string()).optional(),
    
    // For category/difficulty changes
    newCategory: z.enum([ConceptCategory.GRAMMAR, ConceptCategory.VOCABULARY]).optional(),
    newDifficulty: z.enum([
      QuestionLevel.A1,
      QuestionLevel.A2,
      QuestionLevel.B1,
      QuestionLevel.B2,
      QuestionLevel.C1,
      QuestionLevel.C2,
    ]).optional(),
    
    // For LLM analysis
    analysisPrompt: z.string().optional(),
    autoApprove: z.boolean().default(false),
  }),
  preview: z.boolean().default(true), // Preview changes before applying
});

// POST /api/concepts/bulk-update - Bulk operations and LLM analysis
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const validatedData = bulkUpdateSchema.parse(body);

    const conceptManager = new ConceptManagerEnhanced();
    const llmService = new ConceptLLMService();

    // Fetch all concepts to operate on
    const concepts = await Promise.all(
      validatedData.conceptIds.map(id => conceptManager.getConcept(id))
    );

    const validConcepts = concepts.filter(c => c !== null) as IConcept[];
    if (validConcepts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid concepts found",
        },
        { status: 400 }
      );
    }

    let results: BulkOperationResult = {
      operation: validatedData.operation,
      conceptsProcessed: validConcepts.length,
      preview: validatedData.preview,
      changes: [],
      suggestions: [],
    };

    switch (validatedData.operation) {
      case 'tag-assignment':
        results = await handleTagAssignment(
          conceptManager,
          validConcepts,
          validatedData.parameters.tags || [],
          validatedData.preview
        );
        break;

      case 'category-change':
        results = await handleCategoryChange(
          conceptManager,
          validConcepts,
          validatedData.parameters.newCategory!,
          validatedData.preview
        );
        break;

      case 'difficulty-change':
        results = await handleDifficultyChange(
          conceptManager,
          validConcepts,
          validatedData.parameters.newDifficulty!,
          validatedData.preview
        );
        break;

      case 'relationship-suggestions':
        results = await handleRelationshipSuggestions(
          conceptManager,
          llmService,
          validConcepts,
          validatedData.parameters.analysisPrompt,
          validatedData.parameters.autoApprove
        );
        break;

      default:
        throw new Error(`Unsupported operation: ${validatedData.operation}`);
    }

    return NextResponse.json(
      {
        success: true,
        data: results,
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

    console.error("Error in bulk update:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform bulk update",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function for tag assignment
async function handleTagAssignment(
  conceptManager: ConceptManagerEnhanced,
  concepts: IConcept[],
  tags: string[],
  preview: boolean
) {
  const changes: TagAssignmentChange[] = [];

  for (const concept of concepts) {
    const existingTags = concept.tags || [];
    const newTags = Array.from(new Set([...existingTags, ...tags]));
    
    const change: TagAssignmentChange = {
      conceptId: concept.id,
      conceptName: concept.name,
      operation: 'tag-assignment',
      oldValue: existingTags,
      newValue: newTags,
      applied: false,
    };

    if (!preview && newTags.length > existingTags.length) {
      try {
        await conceptManager.updateConcept(concept.id, { tags: newTags });
        change.applied = true;
      } catch (error) {
        change.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    changes.push(change);
  }

  return {
    operation: 'tag-assignment',
    conceptsProcessed: concepts.length,
    preview,
    changes,
    summary: {
      totalTags: tags.length,
      conceptsAffected: changes.filter(c => c.newValue.length > c.oldValue.length).length,
      appliedChanges: changes.filter(c => c.applied).length,
    },
  };
}

// Helper function for category changes
async function handleCategoryChange(
  conceptManager: ConceptManagerEnhanced,
  concepts: IConcept[],
  newCategory: ConceptCategory,
  preview: boolean
) {
  const changes: CategoryChange[] = [];

  for (const concept of concepts) {
    if (concept.category === newCategory) {
      continue; // Skip if already in target category
    }

    const change: CategoryChange = {
      conceptId: concept.id,
      conceptName: concept.name,
      operation: 'category-change',
      oldValue: concept.category,
      newValue: newCategory,
      applied: false,
    };

    if (!preview) {
      try {
        await conceptManager.updateConcept(concept.id, { category: newCategory });
        change.applied = true;
      } catch (error) {
        change.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    changes.push(change);
  }

  return {
    operation: 'category-change',
    conceptsProcessed: concepts.length,
    preview,
    changes,
    summary: {
      targetCategory: newCategory,
      conceptsToChange: changes.length,
      appliedChanges: changes.filter(c => c.applied).length,
    },
  };
}

// Helper function for difficulty changes
async function handleDifficultyChange(
  conceptManager: ConceptManagerEnhanced,
  concepts: IConcept[],
  newDifficulty: QuestionLevel,
  preview: boolean
) {
  const changes: DifficultyChange[] = [];

  for (const concept of concepts) {
    if (concept.difficulty === newDifficulty) {
      continue; // Skip if already at target difficulty
    }

    const change: DifficultyChange = {
      conceptId: concept.id,
      conceptName: concept.name,
      operation: 'difficulty-change',
      oldValue: concept.difficulty,
      newValue: newDifficulty,
      applied: false,
    };

    if (!preview) {
      try {
        await conceptManager.updateConcept(concept.id, { difficulty: newDifficulty });
        change.applied = true;
      } catch (error) {
        change.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    changes.push(change);
  }

  return {
    operation: 'difficulty-change',
    conceptsProcessed: concepts.length,
    preview,
    changes,
    summary: {
      targetDifficulty: newDifficulty,
      conceptsToChange: changes.length,
      appliedChanges: changes.filter(c => c.applied).length,
    },
  };
}

// Helper function for LLM relationship suggestions
async function handleRelationshipSuggestions(
  conceptManager: ConceptManagerEnhanced,
  llmService: ConceptLLMService,
  concepts: IConcept[],
  analysisPrompt?: string,
  autoApprove: boolean = false
) {
  const suggestions: RelationshipSuggestion[] = [];


  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      const concept1 = concepts[i];
      const concept2 = concepts[j];

      try {
        // Use LLM to analyze relationship
        const similarityMatches = await llmService.checkConceptSimilarity(
          {
            name: concept1.name,
            description: concept1.description,
            category: concept1.category,
            examples: concept1.examples || [],
            sourceContent: `Concept from ${concept1.sourceType || 'unknown'} source`,
            confidence: concept1.confidence || 0.8,
            suggestedDifficulty: concept1.difficulty || QuestionLevel.B1,
          },
          [{
            conceptId: concept2.id,
            name: concept2.name,
            category: concept2.category,
            description: concept2.description,
            difficulty: concept2.difficulty,
            isActive: concept2.isActive,
          }]
        );

        if (similarityMatches.length > 0 && similarityMatches[0].similarity > 0.3) {
          const match = similarityMatches[0];
          
          const suggestion: RelationshipSuggestion = {
            fromConceptId: concept1.id,
            fromConceptName: concept1.name,
            toConceptId: concept2.id,
            toConceptName: concept2.name,
            relationshipType: match.similarity > 0.8 ? 'similar' : 'related',
            strength: match.similarity,
            reasoning: match.reasoning || 'LLM similarity analysis',
            applied: false,
          };

          // Auto-apply if requested and high confidence
          if (autoApprove && match.similarity > 0.7) {
            try {
              await conceptManager.createConceptRelationship({
                fromConceptId: concept1.id,
                toConceptId: concept2.id,
                relationshipType: suggestion.relationshipType as RelationshipType,
                strength: suggestion.strength,
                createdBy: 'llm',
                description: suggestion.reasoning,
                bidirectional: true,
              });
              suggestion.applied = true;
            } catch (error) {
              suggestion.error = error instanceof Error ? error.message : 'Unknown error';
            }
          }

          suggestions.push(suggestion);
        }
      } catch (error) {
        console.warn(`Failed to analyze relationship between ${concept1.name} and ${concept2.name}:`, error);
      }
    }
  }

  return {
    operation: 'relationship-suggestions',
    conceptsProcessed: concepts.length,
    suggestions,
    summary: {
      totalSuggestions: suggestions.length,
      appliedSuggestions: suggestions.filter(s => s.applied).length,
      averageStrength: suggestions.length > 0 
        ? suggestions.reduce((sum, s) => sum + s.strength, 0) / suggestions.length 
        : 0,
    },
  };
}