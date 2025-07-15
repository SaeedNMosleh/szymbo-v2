import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManagerEnhanced } from "@/lib/conceptExtraction/conceptManagerEnhanced";
import { ConceptLLMService } from "@/lib/conceptExtraction/conceptLLM";
import { z } from "zod";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

// Request validation schemas
const csvImportSchema = z.object({
  data: z.string(), // CSV content as string
  mapping: z.object({
    name: z.number(),
    category: z.number(),
    description: z.number(),
    difficulty: z.number().optional(),
    examples: z.number().optional(),
    tags: z.number().optional(),
  }),
  hasHeader: z.boolean().default(true),
});

const manualImportSchema = z.object({
  concepts: z.array(z.object({
    name: z.string().min(1).max(100),
    category: z.enum([ConceptCategory.GRAMMAR, ConceptCategory.VOCABULARY]),
    description: z.string().min(1).max(500),
    examples: z.array(z.string()).optional(),
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
  })).min(1),
});

const documentImportSchema = z.object({
  content: z.string().min(10), // Document text content
  extractionSettings: z.object({
    targetCategory: z.enum([ConceptCategory.GRAMMAR, ConceptCategory.VOCABULARY, 'both' as const]).optional(),
    difficulty: z.enum([
      QuestionLevel.A1,
      QuestionLevel.A2,
      QuestionLevel.B1,
      QuestionLevel.B2,
      QuestionLevel.C1,
      QuestionLevel.C2,
    ]).optional(),
    maxConcepts: z.number().min(1).max(100).default(50),
    extractionPrompt: z.string().optional(),
  }),
});

// POST /api/concepts/import - Multi-format import
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    if (!body.type) {
      return NextResponse.json(
        {
          success: false,
          error: "Import type is required",
        },
        { status: 400 }
      );
    }

    const conceptManager = new ConceptManagerEnhanced();
    let result;

    switch (body.type) {
      case 'csv':
        result = await handleCSVImport(conceptManager, body);
        break;

      case 'manual':
        result = await handleManualImport(conceptManager, body);
        break;

      case 'document':
        result = await handleDocumentImport(conceptManager, body);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported import type: ${body.type}`,
          },
          { status: 400 }
        );
    }

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
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

    console.error("Error in concept import:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to import concepts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Handle CSV import
async function handleCSVImport(
  conceptManager: ConceptManagerEnhanced,
  data: any
) {
  const validatedData = csvImportSchema.parse(data);
  
  try {
    const rows = parseCSV(validatedData.data, validatedData.hasHeader);
    const concepts = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const conceptData = {
          name: row[validatedData.mapping.name]?.trim(),
          category: row[validatedData.mapping.category]?.trim().toLowerCase() as ConceptCategory,
          description: row[validatedData.mapping.description]?.trim(),
          difficulty: validatedData.mapping.difficulty !== undefined 
            ? row[validatedData.mapping.difficulty]?.trim() as QuestionLevel
            : QuestionLevel.A1,
          examples: validatedData.mapping.examples !== undefined 
            ? parseArrayField(row[validatedData.mapping.examples])
            : [],
          tags: validatedData.mapping.tags !== undefined 
            ? parseArrayField(row[validatedData.mapping.tags])
            : [],
          sourceType: 'import' as const,
        };

        // Validate required fields
        if (!conceptData.name || !conceptData.category || !conceptData.description) {
          errors.push({
            row: i + 1,
            error: 'Missing required fields (name, category, or description)',
            data: row,
          });
          continue;
        }

        // Validate category
        if (!Object.values(ConceptCategory).includes(conceptData.category)) {
          errors.push({
            row: i + 1,
            error: `Invalid category: ${conceptData.category}`,
            data: row,
          });
          continue;
        }

        const concept = await conceptManager.createOrFindConcept(conceptData);
        concepts.push(concept);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: row,
        });
      }
    }

    return {
      success: true,
      data: {
        imported: concepts,
        errors,
        summary: {
          totalRows: rows.length,
          successfulImports: concepts.length,
          errors: errors.length,
        },
      },
      message: `Imported ${concepts.length} concepts from CSV`,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to parse CSV data",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Handle manual import
async function handleManualImport(
  conceptManager: ConceptManagerEnhanced,
  data: any
) {
  const validatedData = manualImportSchema.parse(data);
  
  const concepts = [];
  const errors = [];

  for (let i = 0; i < validatedData.concepts.length; i++) {
    const conceptData = validatedData.concepts[i];
    
    try {
      const concept = await conceptManager.createOrFindConcept({
        ...conceptData,
        sourceType: 'manual',
        difficulty: conceptData.difficulty || QuestionLevel.A1,
        examples: conceptData.examples || [],
        tags: [...(conceptData.tags || []), 'manual-import'],
      });
      concepts.push(concept);
    } catch (error) {
      errors.push({
        index: i,
        concept: conceptData.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    success: true,
    data: {
      imported: concepts,
      errors,
      summary: {
        totalConcepts: validatedData.concepts.length,
        successfulImports: concepts.length,
        errors: errors.length,
      },
    },
    message: `Manually imported ${concepts.length} concepts`,
  };
}

// Handle document import with LLM extraction
async function handleDocumentImport(
  conceptManager: ConceptManagerEnhanced,
  data: any
) {
  const validatedData = documentImportSchema.parse(data);
  
  try {
    const llmService = new ConceptLLMService();
    
    // Use LLM to extract concepts from document content
    const extractedConcepts = await extractConceptsFromDocument(
      llmService,
      validatedData.content,
      validatedData.extractionSettings
    );

    const concepts = [];
    const errors = [];

    for (const extractedConcept of extractedConcepts) {
      try {
        const concept = await conceptManager.createOrFindConcept({
          name: extractedConcept.name,
          category: extractedConcept.category,
          description: extractedConcept.description,
          examples: extractedConcept.examples || [],
          difficulty: extractedConcept.difficulty || validatedData.extractionSettings.difficulty || QuestionLevel.A1,
          confidence: extractedConcept.confidence || 0.8,
          sourceType: 'document',
          tags: ['document-import', 'llm-extracted'],
        });
        concepts.push(concept);
      } catch (error) {
        errors.push({
          concept: extractedConcept.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: true,
      data: {
        imported: concepts,
        errors,
        extractedConcepts,
        summary: {
          extractedConcepts: extractedConcepts.length,
          successfulImports: concepts.length,
          errors: errors.length,
          documentLength: validatedData.content.length,
        },
      },
      message: `Extracted and imported ${concepts.length} concepts from document`,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to extract concepts from document",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper function to parse CSV data
function parseCSV(csvData: string, hasHeader: boolean): string[][] {
  const lines = csvData.trim().split('\n');
  const rows = [];
  
  const startIndex = hasHeader ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      // Simple CSV parsing - handles basic comma separation
      // For production, consider using a proper CSV parsing library
      const row = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
      rows.push(row);
    }
  }
  
  return rows;
}

// Helper function to parse array fields from CSV (comma-separated values in quotes)
function parseArrayField(value: string): string[] {
  if (!value) return [];
  
  // Handle values like "tag1,tag2,tag3" or "example 1; example 2"
  return value
    .split(/[,;]/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

// Helper function to extract concepts from document using LLM
async function extractConceptsFromDocument(
  llmService: ConceptLLMService,
  content: string,
  settings: any
): Promise<any[]> {
  // This would use the existing ConceptLLMService to extract concepts
  // For now, returning a mock implementation
  
  const extractionPrompt = settings.extractionPrompt || `
    Extract Polish language learning concepts from the following text.
    Focus on ${settings.targetCategory || 'both grammar and vocabulary'} concepts.
    Return a JSON array of concepts with the following structure:
    {
      "name": "concept name",
      "category": "grammar" or "vocabulary",
      "description": "brief description",
      "examples": ["example 1", "example 2"],
      "confidence": 0.8
    }
    
    Limit to ${settings.maxConcepts} concepts maximum.
    
    Text content:
    ${content}
  `;

  try {
    // Call LLM service to extract concepts
    // This is a placeholder - would need actual implementation
    const response = await llmService.analyzeText(extractionPrompt);
    
    // Parse the response and validate concepts
    const extractedConcepts = JSON.parse(response);
    
    return extractedConcepts.slice(0, settings.maxConcepts);
  } catch (error) {
    console.error('LLM extraction failed:', error);
    return [];
  }
}