import OpenAI from "openai";
import dotenv from "dotenv";
import { ExtractedConcept, SimilarityMatch, LLMServiceError } from "./types";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";
import { IConceptIndex } from "@/datamodels/conceptIndex.model";

dotenv.config();

/**
 * Service responsible for LLM interactions for concept extraction and similarity checking
 */
export class ConceptLLMService {
  private openai: OpenAI;
  private retryLimit: number = 3;
  private retryDelay: number = 1000; // milliseconds
  private timeoutDuration: number = 30000; // 30 seconds

  /**
   * Initialize OpenAI client using environment variables
   */
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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

    try {
      const result = await this.makeOpenAIRequest(prompt, "concept_extraction");

      // Parse and validate the response
      if (!result || !Array.isArray(result.concepts)) {
        throw new LLMServiceError(
          "Invalid LLM response format for concept extraction"
        );
      }

      // Map the response to ExtractedConcept objects
      const concepts = result.concepts.map((concept: any) => ({
        name: concept.name || "",
        category: this.validateCategory(concept.category),
        description: concept.description || "",
        examples: Array.isArray(concept.examples) ? concept.examples : [],
        sourceContent: concept.sourceContent || "",
        confidence: this.validateConfidence(concept.confidence),
        suggestedDifficulty: this.validateDifficulty(
          concept.suggestedDifficulty
        ),
      }));

      return concepts;
    } catch (error) {
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

    try {
      const result = await this.makeOpenAIRequest(prompt, "similarity_check");

      // Parse and validate the response
      if (!result || !Array.isArray(result.matches)) {
        throw new LLMServiceError(
          "Invalid LLM response format for similarity check"
        );
      }

      // Map the response to SimilarityMatch objects
      const matches = result.matches.map((match: any) => ({
        conceptId: match.conceptId || "",
        name: match.name || "",
        similarity: this.validateConfidence(match.similarity),
        category: this.validateCategory(match.category),
        description: match.description || "",
      }));

      // Sort by similarity score descending
      return matches.sort(
        (a: SimilarityMatch, b: SimilarityMatch) => b.similarity - a.similarity
      );
    } catch (error) {
      if (error instanceof LLMServiceError) {
        throw error;
      }
      throw new LLMServiceError(
        `Similarity check failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Make an OpenAI API request with retry logic
   * @param prompt The prompt to send to the LLM
   * @param context Context string for error reporting
   * @returns Parsed JSON response
   */
  private async makeOpenAIRequest(
    prompt: string,
    context: string
  ): Promise<any> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < this.retryLimit) {
      attempts++;
      try {
        // Create a promise that will be rejected after the timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () =>
              reject(
                new Error(`Request timed out after ${this.timeoutDuration}ms`)
              ),
            this.timeoutDuration
          );
        });

        // Race the actual request against the timeout
        const completionPromise = this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a Polish language learning assistant specializing in extracting and organizing language concepts from learning materials.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
          top_p: 0.9,
          frequency_penalty: 0,
          presence_penalty: 0,
          response_format: { type: "json_object" },
        });

        const completion = await Promise.race([
          completionPromise,
          timeoutPromise,
        ]);

        // Extract and parse the response content
        const response = completion.choices[0]?.message?.content || "";

        try {
          return JSON.parse(response);
        } catch (parseError) {
          throw new LLMServiceError(
            `Failed to parse LLM response as JSON: ${response.substring(0, 100)}...`
          );
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If this is not the last attempt, wait and retry
        if (attempts < this.retryLimit) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * attempts)
          );
        }
      }
    }

    // If we've exhausted all retries, throw the last error
    throw new LLMServiceError(
      `${context} failed after ${attempts} attempts: ${lastError?.message}`
    );
  }

  /**
   * Build the prompt for concept extraction
   * @param courseContent The course content
   * @returns Formatted prompt string
   */
  private buildExtractionPrompt(courseContent: any): string {
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
  private validateCategory(category: any): ConceptCategory {
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
  private validateConfidence(confidence: any): number {
    const num = Number(confidence);
    if (isNaN(num)) return 0.5; // Default to medium confidence
    return Math.max(0, Math.min(1, num)); // Clamp between 0 and 1
  }

  /**
   * Validate and normalize a difficulty value
   * @param difficulty The difficulty to validate
   * @returns Validated difficulty level
   */
  private validateDifficulty(difficulty: any): QuestionLevel {
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
    console.error(`Concept extraction error in ${errorContext}:`, error);
    return fallback;
  }
}