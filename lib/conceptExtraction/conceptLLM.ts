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
   * Extract concepts from course content using LLM with tag suggestions
   * @param courseContent The course content to extract concepts from
   * @param existingTags Array of existing tags in the system for consistency
   * @returns Array of extracted concepts with suggested tags
   */
  async extractConceptsFromCourse(courseContent: {
    keywords: string[];
    notes: string;
    practice: string;
    newWords: string[];
    homework?: string;
  }, existingTags: string[] = []): Promise<ExtractedConcept[]> {
    const prompt = this.buildExtractionPrompt(courseContent, existingTags);
    const systemPrompt = "You are a Polish language learning assistant specializing in extracting and organizing language concepts from learning materials.";

    try {
      logger.info("Starting concept extraction from course content", {
        operation: "concept_extraction",
        keywordCount: courseContent.keywords.length,
        notesLength: courseContent.notes.length,
        practiceLength: courseContent.practice.length,
        newWordsCount: courseContent.newWords.length,
        hasHomework: !!courseContent.homework,
        existingTagsCount: existingTags.length,
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
      const concepts = (result.concepts as Array<{
        name?: string;
        category?: string;
        description?: string;
        examples?: string[];
        sourceContent?: string;
        confidence?: number;
        suggestedDifficulty?: string;
        suggestedTags?: Array<{
          tag?: string;
          source?: string;
          confidence?: number;
        }>;
      }>).map(
        (concept) => ({
          name: concept.name || "",
          category: this.validateCategory(concept.category),
          description: concept.description || "",
          examples: Array.isArray(concept.examples) ? concept.examples : [],
          sourceContent: concept.sourceContent || "",
          confidence: this.validateConfidence(concept.confidence),
          suggestedDifficulty: this.validateDifficulty(
            concept.suggestedDifficulty
          ),
          suggestedTags: Array.isArray(concept.suggestedTags) 
            ? concept.suggestedTags.map(tag => ({
                tag: tag.tag || "",
                source: (tag.source === 'existing' ? 'existing' : 'new') as 'existing' | 'new',
                confidence: this.validateConfidence(tag.confidence)
              })).filter(tag => tag.tag.length > 0)
            : [],
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
   * Suggest tags for a concept to aid in discovery and search
   * @param concept The concept to suggest tags for
   * @param existingTags Array of existing tags in the system
   * @returns Array of suggested tags with metadata
   */
  async suggestTagsForConcept(
    concept: ExtractedConcept,
    existingTags: string[] = []
  ): Promise<Array<{ tag: string; source: 'existing' | 'new'; confidence: number }>> {
    const prompt = this.buildTagSuggestionPrompt(concept, existingTags);
    const systemPrompt = "You are a Polish language learning assistant specializing in tagging concepts for discovery and search purposes.";

    try {
      logger.info("Starting tag suggestion for concept", {
        operation: "tag_suggestion",
        conceptName: concept.name,
        conceptCategory: concept.category,
        existingTagsCount: existingTags.length,
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
          `Tag suggestion failed: ${response.error || "Unknown error"}`
        );
      }

      const result = response.data as { tags: unknown[] };

      // Parse and validate the response
      if (!result || !Array.isArray(result.tags)) {
        throw new LLMServiceError(
          "Invalid LLM response format for tag suggestion"
        );
      }

      // Map the response to tag objects
      const suggestedTags = (result.tags as Array<{
        tag?: string;
        source?: string;
        confidence?: number;
        reason?: string;
      }>).map(
        (tagData) => ({
          tag: tagData.tag || "",
          source: (tagData.source === 'existing' ? 'existing' : 'new') as 'existing' | 'new',
          confidence: this.validateConfidence(tagData.confidence),
        })
      ).filter(tag => tag.tag.length > 0);

      logger.success("Tag suggestion completed successfully", {
        operation: "tag_suggestion",
        conceptName: concept.name,
        suggestedTagsCount: suggestedTags.length,
        duration: response.metadata?.duration,
      });

      return suggestedTags;
    } catch (error) {
      logger.error("Tag suggestion failed", error as Error);
      
      if (error instanceof LLMServiceError) {
        throw error;
      }
      throw new LLMServiceError(
        `Tag suggestion failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Analyze text content using LLM
   * @param prompt The prompt to send to the LLM
   * @returns The LLM response
   */
  async analyzeText(prompt: string): Promise<string> {
    const systemPrompt = "You are an expert Polish language learning assistant. Analyze the given text and provide structured, helpful insights.";

    try {
      logger.info("Starting text analysis", {
        operation: "text_analysis",
        promptLength: prompt.length,
      });

      const response = await this.llmService.generateResponse({
        prompt,
        systemPrompt,
      });

      if (!response.success || !response.data) {
        throw new LLMServiceError(
          `Text analysis failed: ${response.error || "Unknown error"}`
        );
      }

      logger.success("Text analysis completed", {
        operation: "text_analysis",
        duration: response.metadata?.duration,
      });

      return response.data as string;
    } catch (error) {
      logger.error("Text analysis failed", error as Error);
      
      if (error instanceof LLMServiceError) {
        throw error;
      }
      throw new LLMServiceError(
        `Text analysis failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check similarity between an extracted concept and existing concepts for merge potential
   * @param extractedConcept The newly extracted concept
   * @param existingConcepts Array of existing concept indexes
   * @returns Array of similarity matches with merge potential
   */
  async checkConceptSimilarity(
    extractedConcept: ExtractedConcept,
    existingConcepts: IConceptIndex[]
  ): Promise<SimilarityMatch[]> {
    // If no existing concepts, return empty array
    if (!existingConcepts || existingConcepts.length === 0) {
      return [];
    }

    const prompt = this.buildMergeSimilarityPrompt(
      extractedConcept,
      existingConcepts
    );
    const systemPrompt = "You are tasked with identifying merge potential between language concepts for a Polish learning application.";

    try {
      logger.info("Starting concept merge similarity check", {
        operation: "merge_similarity_check",
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
          `Merge similarity check failed: ${response.error || "Unknown error"}`
        );
      }

      const result = response.data as { matches: unknown[] };

      // Parse and validate the response
      if (!result || !Array.isArray(result.matches)) {
        throw new LLMServiceError(
          "Invalid LLM response format for merge similarity check"
        );
      }

      // Map the response to SimilarityMatch objects with merge data
      const matches = (result.matches as Array<{
        conceptId?: string;
        name?: string;
        similarity?: number;
        category?: string;
        description?: string;
        examples?: string[];
        mergeScore?: number;
        mergeSuggestion?: {
          reason?: string;
          conflictingFields?: string[];
          suggestedMergedDescription?: string;
        };
      }>).map(
        (match) => ({
          conceptId: match.conceptId || "",
          name: match.name || "",
          similarity: this.validateConfidence(match.similarity),
          category: this.validateCategory(match.category),
          description: match.description || "",
          examples: Array.isArray(match.examples) ? match.examples : [],
          mergeScore: this.validateConfidence(match.mergeScore),
          mergeSuggestion: match.mergeSuggestion ? {
            reason: match.mergeSuggestion.reason || "",
            conflictingFields: Array.isArray(match.mergeSuggestion.conflictingFields) 
              ? match.mergeSuggestion.conflictingFields 
              : [],
            suggestedMergedDescription: match.mergeSuggestion.suggestedMergedDescription,
          } : undefined,
        })
      );

      // Filter for high merge potential and sort by merge score
      const mergeableMatches = matches
        .filter(match => match.mergeScore >= 0.7) // Only high merge potential
        .sort((a, b) => b.mergeScore - a.mergeScore);

      logger.success("Concept merge similarity check completed", {
        operation: "merge_similarity_check",
        matchesFound: mergeableMatches.length,
        duration: response.metadata?.duration,
      });

      return mergeableMatches;
    } catch (error) {
      logger.error("Concept merge similarity check failed", error as Error);
      
      if (error instanceof LLMServiceError) {
        throw error;
      }
      throw new LLMServiceError(
        `Merge similarity check failed: ${error instanceof Error ? error.message : String(error)}`
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
   * Build the prompt for concept extraction with tag suggestions
   * @param courseContent The course content
   * @param existingTags Array of existing tags for consistency
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
  }, existingTags: string[] = []): string {
    return `
You are tasked with extracting language learning concepts from Polish language course materials and suggesting tags for discovery.

## COURSE CONTENT:
- Keywords: ${JSON.stringify(courseContent.keywords)}
- New Vocabulary Words: ${JSON.stringify(courseContent.newWords)}
- Notes: ${courseContent.notes}
- Practice Content: ${courseContent.practice}
${courseContent.homework ? `- Homework: ${courseContent.homework}` : ""}

## EXISTING TAGS IN SYSTEM:
${existingTags.length > 0 ? JSON.stringify(existingTags.slice(0, 50)) : "No existing tags"}

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
   - Suggest 3-5 tags for discovery purposes

3. For suggested tags:
   - Use existing tags when appropriate for consistency
   - Create new tags when needed for better discovery
   - Focus on searchable keywords that help find concepts
   - Include grammatical features, semantic categories, difficulty markers
   - Each tag should have a confidence score (0.0-1.0)

## EXAMPLES:

Good GRAMMAR concept:
{
  "name": "Locative Case with Time Expressions",
  "category": "grammar",
  "description": "Using the locative case with preposition 'po' to express time in informal format",
  "examples": ["kwadrans po ósmej", "dwadzieścia po dziesiątej"],
  "sourceContent": "Found in practice section discussing time expressions",
  "confidence": 0.95,
  "suggestedDifficulty": "A2",
  "suggestedTags": [
    {"tag": "locative-case", "source": "new", "confidence": 0.9},
    {"tag": "time-expressions", "source": "existing", "confidence": 0.95},
    {"tag": "prepositions", "source": "existing", "confidence": 0.8},
    {"tag": "A2-level", "source": "new", "confidence": 0.9}
  ]
}

Good VOCABULARY concept:
{
  "name": "Time-Related Vocabulary",
  "category": "vocabulary",
  "description": "Essential vocabulary for telling time in Polish",
  "examples": ["kwadrans", "wpół do", "za pięć"],
  "sourceContent": "From notes section on telling time",
  "confidence": 0.9,
  "suggestedDifficulty": "A1",
  "suggestedTags": [
    {"tag": "time-vocabulary", "source": "new", "confidence": 0.95},
    {"tag": "daily-life", "source": "existing", "confidence": 0.8},
    {"tag": "A1-level", "source": "new", "confidence": 0.9},
    {"tag": "numbers", "source": "existing", "confidence": 0.7}
  ]
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
      "suggestedDifficulty": "A1|A2|B1|B2|C1|C2",
      "suggestedTags": [
        {
          "tag": "string",
          "source": "existing|new",
          "confidence": number // 0.0-1.0
        }
      ]
    },
    // Additional concepts...
  ]
}

Extract at least 3 concepts but no more than 10 concepts, focusing on the most important and clearly defined ones.
`;
  }

  /**
   * Build the prompt for tag suggestions
   * @param concept The concept to suggest tags for
   * @param existingTags Array of existing tags
   * @returns Formatted prompt string
   */
  private buildTagSuggestionPrompt(
    concept: ExtractedConcept,
    existingTags: string[]
  ): string {
    return `
You are tasked with suggesting tags for a Polish language learning concept to aid in discovery and search.

## CONCEPT TO TAG:
${JSON.stringify(concept, null, 2)}

## EXISTING TAGS IN SYSTEM:
${existingTags.length > 0 ? JSON.stringify(existingTags.slice(0, 50)) : "No existing tags"}

## TASK:
Suggest 3-5 tags for this concept that will help users discover it when searching for related concepts. Consider:

1. **Grammatical features**: cases, verb forms, sentence patterns, etc.
2. **Semantic categories**: daily life, emotions, travel, food, etc.
3. **Difficulty markers**: A1-level, beginner, intermediate, etc.
4. **Functional categories**: questions, polite-forms, informal-speech, etc.
5. **Learning contexts**: classroom, conversation, reading, etc.

Guidelines:
- Prefer existing tags when appropriate for consistency
- Create new tags when needed for better discovery
- Keep tags short and searchable (1-3 words)
- Use hyphens for multi-word tags (e.g., "time-expressions")
- Focus on what learners would search for

## RESPONSE FORMAT:
Respond strictly with a JSON object containing an array of suggested tags:

{
  "tags": [
    {
      "tag": "string",
      "source": "existing|new",
      "confidence": number, // 0.0-1.0
      "reason": "string" // Brief explanation for why this tag is relevant
    },
    // Additional tags...
  ]
}

Provide 3-5 tags, prioritizing those that would be most helpful for discovery.
`;
  }

  /**
   * Build the prompt for merge similarity checking
   * @param concept The extracted concept to check
   * @param existing Array of existing concept indexes
   * @returns Formatted prompt string
   */
  private buildMergeSimilarityPrompt(
    concept: ExtractedConcept,
    existing: IConceptIndex[]
  ): string {
    return `
You are tasked with identifying merge potential between a newly extracted language concept and existing concepts in our database.

## NEWLY EXTRACTED CONCEPT:
${JSON.stringify(concept, null, 2)}

## EXISTING CONCEPTS:
${JSON.stringify(existing.slice(0, 20), null, 2)}

## TASK:
Compare the newly extracted concept with the existing concepts and identify any that could potentially be merged. Focus on:

1. **Duplicate concepts**: Nearly identical content that should be merged
2. **Overlapping concepts**: Similar content that could be consolidated
3. **Complementary concepts**: Related concepts that might be better as one

For each potential merge:
- Assign a similarity score (0.0-1.0) for content similarity
- Assign a merge score (0.0-1.0) for merge potential
- Identify conflicting fields that would need resolution
- Suggest how to merge the descriptions

## MERGE GUIDELINES:
- 0.9-1.0: Highly recommended merge (near duplicates)
- 0.7-0.8: Recommended merge (significant overlap)
- 0.5-0.6: Possible merge (some overlap, manual review needed)
- 0.3-0.4: Unlikely merge (different concepts with minor overlap)
- 0.0-0.2: No merge recommended (clearly different concepts)

## RESPONSE FORMAT:
Respond strictly with a JSON object containing an array of matches:

{
  "matches": [
    {
      "conceptId": "string",
      "name": "string", 
      "similarity": number, // 0.0-1.0
      "category": "grammar|vocabulary",
      "description": "string",
      "examples": ["string", "string"],
      "mergeScore": number, // 0.0-1.0
      "mergeSuggestion": {
        "reason": "string",
        "conflictingFields": ["string", "string"],
        "suggestedMergedDescription": "string"
      }
    },
    // Additional matches...
  ]
}

Return only concepts with merge score >= 0.7, limited to the top 3 most mergeable concepts. If no merge candidates are found, return an empty array.
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
