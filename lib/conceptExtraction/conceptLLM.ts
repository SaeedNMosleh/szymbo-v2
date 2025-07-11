import { OpenAIService } from "@/lib/services/llm/openAIService";
import { LLMServiceError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { ExtractedConcept, SimilarityMatch } from "./types";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";
import { IConceptIndex } from "@/datamodels/conceptIndex.model";

/**
 * Service responsible for LLM interactions for concept extraction and similarity checking
 */
export class ConceptLLMService {
  private llmService: OpenAIService;

  /**
   * Initialize LLM service using the centralized abstraction
   */
  constructor() {
    this.llmService = new OpenAIService({
      apiKey: process.env.OPENAI_API_KEY!,
      model: "gpt-4o",
      temperature: 0.3,
      maxTokens: 2000,
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
    });
  }

  /**
   * Extract concepts from course content using LLM
   * @param courseContent The course content to extract concepts from
   * @returns Array of extracted concepts
   */
  async extractConceptsFromCourse(courseContent: {
    keywords: string[];
    notes: string;
    practice: string;
    newWords: string[];
    homework?: string;
  }): Promise<ExtractedConcept[]> {
    const prompt = this.buildExtractionPrompt(courseContent);
    const systemPrompt = "You are a Polish language learning assistant specializing in extracting and organizing language concepts from learning materials.";

    try {
      logger.info("Starting concept extraction from course content", {
        operation: "concept_extraction",
        keywordCount: courseContent.keywords.length,
        notesLength: courseContent.notes.length,
        practiceLength: courseContent.practice.length,
        newWordsCount: courseContent.newWords.length,
        hasHomework: !!courseContent.homework,
      });

      const response = await this.llmService.generateResponse(
        {
          prompt,
          systemPrompt,
        },
        (rawResponse: string) => this.parseJsonResponse(rawResponse)
      );

      if (!response.success || !response.data) {
        throw new LLMServiceError(
          `Concept extraction failed: ${response.error || "Unknown error"}`
        );
      }

      const result = response.data as { concepts: unknown[] };

      // Parse and validate the response
      if (!result || !Array.isArray(result.concepts)) {
        throw new LLMServiceError(
          "Invalid LLM response format for concept extraction"
        );
      }

      // Map the response to ExtractedConcept objects
      const concepts = result.concepts.map(
        (concept: {
          name?: string;
          category?: string;
          description?: string;
          examples?: string[];
          sourceContent?: string;
          confidence?: number;
          suggestedDifficulty?: string;
        }) => ({
          name: concept.name || "",
          category: this.validateCategory(concept.category),
          description: concept.description || "",
          examples: Array.isArray(concept.examples) ? concept.examples : [],
          sourceContent: concept.sourceContent || "",
          confidence: this.validateConfidence(concept.confidence),
          suggestedDifficulty: this.validateDifficulty(
            concept.suggestedDifficulty
          ),
        })
      );

      logger.success("Concept extraction completed successfully", {
        operation: "concept_extraction",
        conceptCount: concepts.length,
        duration: response.metadata?.duration,
      });

      return concepts;
    } catch (error) {
      logger.error("Concept extraction failed", error as Error);
      
      if (error instanceof LLMServiceError) {
        throw error;
      }
      throw new LLMServiceError(
        `Concept extraction failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check similarity between an extracted concept and existing concepts
   * @param extractedConcept The newly extracted concept
   * @param existingConcepts Array of existing concept indexes
   * @returns Array of similarity matches
   */
  async checkConceptSimilarity(
    extractedConcept: ExtractedConcept,
    existingConcepts: IConceptIndex[]
  ): Promise<SimilarityMatch[]> {
    // If no existing concepts, return empty array
    if (!existingConcepts || existingConcepts.length === 0) {
      return [];
    }

    const prompt = this.buildSimilarityPrompt(
      extractedConcept,
      existingConcepts
    );
    const systemPrompt = "You are tasked with identifying similarity between language concepts for a Polish learning application.";

    try {
      logger.info("Starting concept similarity check", {
        operation: "similarity_check",
        extractedConceptName: extractedConcept.name,
        existingConceptsCount: existingConcepts.length,
      });

      const response = await this.llmService.generateResponse(
        {
          prompt,
          systemPrompt,
        },
        (rawResponse: string) => this.parseJsonResponse(rawResponse)
      );

      if (!response.success || !response.data) {
        throw new LLMServiceError(
          `Similarity check failed: ${response.error || "Unknown error"}`
        );
      }

      const result = response.data as { matches: unknown[] };

      // Parse and validate the response
      if (!result || !Array.isArray(result.matches)) {
        throw new LLMServiceError(
          "Invalid LLM response format for similarity check"
        );
      }

      // Map the response to SimilarityMatch objects
      const matches = result.matches.map(
        (match: {
          conceptId?: string;
          name?: string;
          similarity?: number;
          category?: string;
          description?: string;
        }) => ({
          conceptId: match.conceptId || "",
          name: match.name || "",
          similarity: this.validateConfidence(match.similarity),
          category: this.validateCategory(match.category),
          description: match.description || "",
        })
      );

      // Sort by similarity score descending
      const sortedMatches = matches.sort(
        (a: SimilarityMatch, b: SimilarityMatch) => b.similarity - a.similarity
      );

      logger.success("Concept similarity check completed", {
        operation: "similarity_check",
        matchesFound: sortedMatches.length,
        duration: response.metadata?.duration,
      });

      return sortedMatches;
    } catch (error) {
      logger.error("Concept similarity check failed", error as Error);
      
      if (error instanceof LLMServiceError) {
        throw error;
      }
      throw new LLMServiceError(
        `Similarity check failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Parse JSON response from LLM with error handling
   * @param response Raw response from LLM
   * @returns Parsed JSON object
   */
  private parseJsonResponse(response: string): Record<string, unknown> {
    try {
      // Try to extract JSON from response if it's wrapped in markdown or other text
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response.trim();

      return JSON.parse(jsonString);
    } catch (error) {
      logger.warn("Failed to parse JSON response", {
        error: error instanceof Error ? error.message : 'Unknown error',
        response: response.substring(0, 200),
      });

      throw new LLMServiceError(
        `Failed to parse LLM response as JSON: ${response.substring(0, 100)}...`
      );
    }
  }

  /**
   * Build the prompt for concept extraction
   * @param courseContent The course content
   * @returns Formatted prompt string
   */
  private buildExtractionPrompt(courseContent: {
    keywords?: string[];
    content?: string;
    title?: string;
    newWords?: string[];
    notes?: string;
    practice?: string;
    homework?: string;
  }): string {
    return `
You are tasked with extracting language learning concepts from Polish language course materials.

## COURSE CONTENT:
- Keywords: ${JSON.stringify(courseContent.keywords)}
- New Vocabulary Words: ${JSON.stringify(courseContent.newWords)}
- Notes: ${courseContent.notes}
- Practice Content: ${courseContent.practice}
${courseContent.homework ? `- Homework: ${courseContent.homework}` : ""}

## TASK:
Extract clearly defined language concepts from the above content, following these guidelines:

1. Categorize each concept as either GRAMMAR or VOCABULARY.
   - GRAMMAR: Sentence structures, verb conjugation patterns, case usage, etc.
   - VOCABULARY: Word groups, expressions, idioms, colloquialisms, etc.

2. For each concept:
   - Provide a clear, descriptive name
   - Write a concise but comprehensive description
   - Include 2-4 examples from the content
   - Note where in the content you found this concept
   - Assign a confidence score (0.0-1.0) indicating how clearly this concept is present
   - Suggest a difficulty level (A1, A2, B1, B2, C1, or C2)

## EXAMPLES:

Good GRAMMAR concept:
{
  "name": "Locative Case with Time Expressions",
  "category": "grammar",
  "description": "Using the locative case with preposition 'po' to express time in informal format",
  "examples": ["kwadrans po ósmej", "dwadzieścia po dziesiątej"],
  "sourceContent": "Found in practice section discussing time expressions",
  "confidence": 0.95,
  "suggestedDifficulty": "A2"
}

Good VOCABULARY concept:
{
  "name": "Time-Related Vocabulary",
  "category": "vocabulary",
  "description": "Essential vocabulary for telling time in Polish",
  "examples": ["kwadrans", "wpół do", "za pięć"],
  "sourceContent": "From notes section on telling time",
  "confidence": 0.9,
  "suggestedDifficulty": "A1"
}

## RESPONSE FORMAT:
Respond strictly with a JSON object containing an array of concepts:

{
  "concepts": [
    {
      "name": "string",
      "category": "grammar|vocabulary",
      "description": "string",
      "examples": ["string", "string"],
      "sourceContent": "string",
      "confidence": number, // 0.0-1.0
      "suggestedDifficulty": "A1|A2|B1|B2|C1|C2"
    },
    // Additional concepts...
  ]
}

Extract at least 3 concepts but no more than 10 concepts, focusing on the most important and clearly defined ones.
`;
  }

  /**
   * Build the prompt for similarity checking
   * @param concept The extracted concept to check
   * @param existing Array of existing concept indexes
   * @returns Formatted prompt string
   */
  private buildSimilarityPrompt(
    concept: ExtractedConcept,
    existing: IConceptIndex[]
  ): string {
    return `
You are tasked with identifying similarity between a newly extracted language concept and existing concepts in our database.

## NEWLY EXTRACTED CONCEPT:
${JSON.stringify(concept, null, 2)}

## EXISTING CONCEPTS:
${JSON.stringify(existing.slice(0, 20), null, 2)}

## TASK:
Compare the newly extracted concept with the existing concepts and identify any that are semantically similar. Consider:

1. Similar names or synonymous terms
2. Similar descriptions or overlapping content
3. Matching categories (grammar or vocabulary)
4. Similar difficulty levels

For each similar concept:
- Assign a similarity score (0.0-1.0)
- Include justification for the similarity

## SIMILARITY GUIDELINES:
- 0.9-1.0: Nearly identical concepts
- 0.7-0.8: Highly similar concepts with minor differences
- 0.5-0.6: Moderately similar concepts with some overlap
- 0.3-0.4: Somewhat similar concepts with significant differences
- 0.0-0.2: Largely different concepts

## RESPONSE FORMAT:
Respond strictly with a JSON object containing an array of matches:

{
  "matches": [
    {
      "conceptId": "string",
      "name": "string", 
      "similarity": number, // 0.0-1.0
      "category": "grammar|vocabulary",
      "description": "string"
    },
    // Additional matches...
  ]
}

Return only concepts with similarity score >= 0.3, limited to the top 3 most similar concepts. If no similar concepts are found, return an empty array.
`;
  }

  /**
   * Validate and normalize a category value
   * @param category The category to validate
   * @returns Validated category
   */
  private validateCategory(category: string | undefined): ConceptCategory {
    if (category === ConceptCategory.GRAMMAR || category === "grammar") {
      return ConceptCategory.GRAMMAR;
    }
    if (category === ConceptCategory.VOCABULARY || category === "vocabulary") {
      return ConceptCategory.VOCABULARY;
    }
    // Default to grammar if invalid
    return ConceptCategory.GRAMMAR;
  }

  /**
   * Validate and normalize a confidence value
   * @param confidence The confidence value to validate
   * @returns Validated confidence between 0 and 1
   */
  private validateConfidence(confidence: number | string | undefined): number {
    const num = Number(confidence);
    if (isNaN(num)) return 0.5; // Default to medium confidence
    return Math.max(0, Math.min(1, num)); // Clamp between 0 and 1
  }

  /**
   * Validate and normalize a difficulty value
   * @param difficulty The difficulty to validate
   * @returns Validated difficulty level
   */
  private validateDifficulty(difficulty: string | undefined): QuestionLevel {
    const validLevels = Object.values(QuestionLevel);
    if (
      typeof difficulty === "string" &&
      validLevels.includes(difficulty as QuestionLevel)
    ) {
      return difficulty as QuestionLevel;
    }
    // Default to B1 if invalid
    return QuestionLevel.B1;
  }
}

/**
 * Error handling wrapper for LLM operations
 * @param operation The async operation to execute
 * @param fallback Fallback value if operation fails
 * @param errorContext Context string for error reporting
 * @returns Operation result or fallback value
 */
export async function safeConceptExtraction<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorContext: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(`Concept extraction error in ${errorContext}`, error as Error);
    return fallback;
  }
}
