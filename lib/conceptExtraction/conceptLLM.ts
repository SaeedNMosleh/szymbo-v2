import { LLMServiceFactory } from "@/lib/services/llm/llmServiceFactory";
import { OpenAIService } from "@/lib/services/llm/openAIService";
import { LLMServiceError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { createLLMJsonParser } from "@/lib/utils/jsonParser";
import { ExtractedConcept, SimilarityMatch } from "./types";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";
import { IConceptIndex } from "@/datamodels/conceptIndex.model";
import {
  VOCABULARY_EXTRACTION_PROMPT,
  GRAMMAR_EXTRACTION_PROMPT,
  TAG_SUGGESTION_PROMPT,
  MERGE_SIMILARITY_PROMPT,
  CONCEPT_EXTRACTION_SYSTEM_PROMPT,
  TAG_SUGGESTION_SYSTEM_PROMPT,
  MERGE_SIMILARITY_SYSTEM_PROMPT,
  TEXT_ANALYSIS_SYSTEM_PROMPT,
} from "@/prompts/conceptExtraction";

/**
 * Service responsible for LLM interactions for concept extraction and similarity checking
 */
export class ConceptLLMService {
  private llmService: OpenAIService;

  /**
   * Initialize LLM service using the centralized configuration
   */
  constructor() {
    this.llmService =
      LLMServiceFactory.getOpenAIServiceForUseCase("conceptExtraction");
  }

  /**
   * Extract vocabulary concepts from newWords array
   * @param newWords Array of Polish words to extract as vocabulary concepts
   * @param existingTags Array of existing tags in the system for consistency
   * @returns Array of vocabulary concepts
   */
  async extractVocabularyConcepts(
    newWords: string[],
    existingTags: string[] = []
  ): Promise<ExtractedConcept[]> {
    if (!newWords || newWords.length === 0) {
      return [];
    }

    const prompt = this.buildVocabularyExtractionPrompt(newWords, existingTags);
    const systemPrompt = CONCEPT_EXTRACTION_SYSTEM_PROMPT;

    try {
      logger.info("Starting vocabulary concept extraction", {
        operation: "vocabulary_extraction",
        newWordsCount: newWords.length,
        existingTagsCount: existingTags.length,
      });

      const response = await this.llmService.generateResponse(
        {
          prompt,
          systemPrompt,
        },
        createLLMJsonParser<{ concepts: unknown[] }>(undefined, {
          enableRepair: true,
          logErrors: true,
        })
      );

      if (!response.success || !response.data) {
        throw new LLMServiceError(
          `Vocabulary extraction failed: ${response.error || "Unknown error"}`
        );
      }

      const result = response.data as { concepts: unknown[] };

      if (!result || !Array.isArray(result.concepts)) {
        throw new LLMServiceError(
          "Invalid LLM response format for vocabulary extraction"
        );
      }

      const concepts = this.parseExtractedConcepts(result.concepts);

      logger.success("Vocabulary extraction completed successfully", {
        operation: "vocabulary_extraction",
        conceptCount: concepts.length,
        duration: response.metadata?.duration,
      });

      return concepts;
    } catch (error) {
      logger.error("Vocabulary extraction failed", error as Error);

      if (error instanceof LLMServiceError) {
        throw error;
      }
      throw new LLMServiceError(
        `Vocabulary extraction failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Extract grammar concepts from combined text content
   * @param textContent Combined notes, practice, and homework content
   * @param existingTags Array of existing tags in the system for consistency
   * @returns Array of grammar concepts
   */
  async extractGrammarConcepts(
    textContent: {
      notes: string;
      practice: string;
      homework?: string;
    },
    existingTags: string[] = []
  ): Promise<ExtractedConcept[]> {
    const combinedText = [
      textContent.notes,
      textContent.practice,
      textContent.homework || "",
    ]
      .filter((text) => text.trim().length > 0)
      .join("\n\n");

    if (!combinedText.trim()) {
      return [];
    }

    const prompt = this.buildGrammarExtractionPrompt(
      combinedText,
      existingTags
    );
    const systemPrompt = CONCEPT_EXTRACTION_SYSTEM_PROMPT;

    try {
      logger.info("Starting grammar concept extraction", {
        operation: "grammar_extraction",
        contentLength: combinedText.length,
        existingTagsCount: existingTags.length,
      });

      const response = await this.llmService.generateResponse(
        {
          prompt,
          systemPrompt,
        },
        createLLMJsonParser<{ concepts: unknown[] }>(undefined, {
          enableRepair: true,
          logErrors: true,
        })
      );

      if (!response.success || !response.data) {
        throw new LLMServiceError(
          `Grammar extraction failed: ${response.error || "Unknown error"}`
        );
      }

      const result = response.data as { concepts: unknown[] };

      if (!result || !Array.isArray(result.concepts)) {
        throw new LLMServiceError(
          "Invalid LLM response format for grammar extraction"
        );
      }

      const concepts = this.parseExtractedConcepts(result.concepts);

      logger.success("Grammar extraction completed successfully", {
        operation: "grammar_extraction",
        conceptCount: concepts.length,
        duration: response.metadata?.duration,
      });

      return concepts;
    } catch (error) {
      logger.error("Grammar extraction failed", error as Error);

      if (error instanceof LLMServiceError) {
        throw error;
      }
      throw new LLMServiceError(
        `Grammar extraction failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Extract concepts from course content using LLM with tag suggestions (legacy method)
   * @param courseContent The course content to extract concepts from
   * @param existingTags Array of existing tags in the system for consistency
   * @returns Array of extracted concepts with suggested tags
   */
  async extractConceptsFromCourse(
    courseContent: {
      keywords: string[];
      notes: string;
      practice: string;
      newWords: string[];
      homework?: string;
    },
    existingTags: string[] = []
  ): Promise<ExtractedConcept[]> {
    const prompt = this.buildExtractionPrompt(courseContent);
    const systemPrompt = CONCEPT_EXTRACTION_SYSTEM_PROMPT;

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
        createLLMJsonParser<{ concepts: unknown[] }>(undefined, {
          enableRepair: true,
          logErrors: true,
        })
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

      const concepts = this.parseExtractedConcepts(result.concepts);

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
  ): Promise<
    Array<{ tag: string; source: "existing" | "new"; confidence: number }>
  > {
    const prompt = this.buildTagSuggestionPrompt(concept, existingTags);
    const systemPrompt = TAG_SUGGESTION_SYSTEM_PROMPT;

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
        createLLMJsonParser<{ tags: unknown[] }>(undefined, {
          enableRepair: true,
          logErrors: true,
        })
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
      const suggestedTags = (
        result.tags as Array<{
          tag?: string;
          source?: string;
          confidence?: number;
          reason?: string;
        }>
      )
        .map((tagData) => ({
          tag: tagData.tag || "",
          source: (tagData.source === "existing" ? "existing" : "new") as
            | "existing"
            | "new",
          confidence: this.validateConfidence(tagData.confidence),
        }))
        .filter((tag) => tag.tag.length > 0);

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
    const systemPrompt = TEXT_ANALYSIS_SYSTEM_PROMPT;

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
    const systemPrompt = MERGE_SIMILARITY_SYSTEM_PROMPT;

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
        createLLMJsonParser<{ matches: unknown[] }>(undefined, {
          enableRepair: true,
          logErrors: true,
        })
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
      const matches = (
        result.matches as Array<{
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
        }>
      ).map((match) => ({
        conceptId: match.conceptId || "",
        name: match.name || "",
        similarity: this.validateConfidence(match.similarity),
        category: this.validateCategory(match.category),
        description: match.description || "",
        examples: Array.isArray(match.examples) ? match.examples : [],
        mergeScore: this.validateConfidence(match.mergeScore),
        mergeSuggestion: match.mergeSuggestion
          ? {
              reason: match.mergeSuggestion.reason || "",
              conflictingFields: Array.isArray(
                match.mergeSuggestion.conflictingFields
              )
                ? match.mergeSuggestion.conflictingFields
                : [],
              suggestedMergedDescription:
                match.mergeSuggestion.suggestedMergedDescription,
            }
          : undefined,
      }));

      // Filter for high merge potential and sort by merge score
      const mergeableMatches = matches
        .filter((match) => match.mergeScore >= 0.7) // Only high merge potential
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
   * Build the prompt for vocabulary extraction
   * @param newWords Array of Polish words
   * @param existingTags Array of existing tags for consistency
   * @returns Formatted prompt string
   */
  private buildVocabularyExtractionPrompt(
    newWords: string[],
    existingTags: string[] = []
  ): string {
    return VOCABULARY_EXTRACTION_PROMPT.replace(
      "{newWords}",
      JSON.stringify(newWords)
    ).replace(
      "{existingTags}",
      existingTags.length > 0
        ? JSON.stringify(existingTags.slice(0, 50))
        : "No existing tags"
    );
  }

  /**
   * Build the prompt for grammar extraction
   * @param combinedText Combined notes, practice, and homework content
   * @param existingTags Array of existing tags for consistency
   * @returns Formatted prompt string
   */
  private buildGrammarExtractionPrompt(
    combinedText: string,
    existingTags: string[] = []
  ): string {
    return GRAMMAR_EXTRACTION_PROMPT.replace(
      "{combinedText}",
      combinedText
    ).replace(
      "{existingTags}",
      existingTags.length > 0
        ? JSON.stringify(existingTags.slice(0, 50))
        : "No existing tags"
    );
  }

  /**
   * Build the prompt for concept extraction with tag suggestions (legacy method)
   * @param courseContent The course content
   * @param existingTags Array of existing tags for consistency
   * @returns Formatted prompt string
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private buildExtractionPrompt(_courseContent: {
    keywords?: string[];
    content?: string;
    title?: string;
    newWords?: string[];
    notes?: string;
    practice?: string;
    homework?: string;
  }): string {
    // Note: This legacy method is no longer functional after removing CONCEPT_EXTRACTION_BASE_PROMPT
    // Use the new extractVocabularyConcepts() and extractGrammarConcepts() methods instead
    throw new Error(
      "Legacy extractConceptsFromCourse method is deprecated. Use extractVocabularyConcepts() and extractGrammarConcepts() instead."
    );
  }

  /**
   * Parse and validate extracted concepts from LLM response
   * @param concepts Raw concept data from LLM
   * @returns Array of validated ExtractedConcept objects
   */
  private parseExtractedConcepts(concepts: unknown[]): ExtractedConcept[] {
    return (
      concepts as Array<{
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
        vocabularyData?: {
          word?: string;
          translation?: string;
          partOfSpeech?: string;
          gender?: string;
          pluralForm?: string;
          pronunciation?: string;
        };
      }>
    ).map((concept) => ({
      name: concept.name || "",
      category: this.validateCategory(concept.category),
      description: concept.description || "",
      examples: Array.isArray(concept.examples) ? concept.examples : [],
      sourceContent: concept.sourceContent || "",
      confidence: this.validateConfidence(concept.confidence),
      suggestedDifficulty: this.validateDifficulty(concept.suggestedDifficulty),
      suggestedTags: Array.isArray(concept.suggestedTags)
        ? concept.suggestedTags
            .map((tag) => ({
              tag: tag.tag || "",
              source: (tag.source === "existing" ? "existing" : "new") as
                | "existing"
                | "new",
              confidence: this.validateConfidence(tag.confidence),
            }))
            .filter((tag) => tag.tag.length > 0)
        : [],
      vocabularyData: concept.vocabularyData
        ? {
            word: concept.vocabularyData.word || concept.name || "",
            translation: concept.vocabularyData.translation || "",
            partOfSpeech: concept.vocabularyData.partOfSpeech || "",
            gender: concept.vocabularyData.gender || undefined,
            pluralForm: concept.vocabularyData.pluralForm || undefined,
            pronunciation: concept.vocabularyData.pronunciation || undefined,
          }
        : undefined,
    }));
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
    return TAG_SUGGESTION_PROMPT.replace(
      "{concept}",
      JSON.stringify(concept, null, 2)
    ).replace(
      "{existingTags}",
      existingTags.length > 0
        ? JSON.stringify(existingTags.slice(0, 50))
        : "No existing tags"
    );
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
    return MERGE_SIMILARITY_PROMPT.replace(
      "{extractedConcept}",
      JSON.stringify(concept, null, 2)
    ).replace(
      "{existingConcepts}",
      JSON.stringify(existing.slice(0, 20), null, 2)
    );
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
