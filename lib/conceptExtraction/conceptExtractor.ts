import { ConceptManager } from "./conceptManager";
import { ConceptLLMService } from "./conceptLLM";
import {
  ConceptReviewData,
  ExtractionResult,
  SimilarityMatch,
  ExtractedConcept,
  ConceptExtractionError,
} from "./types";
import { ConceptExtractionStatus } from "@/lib/enum";
import Course from "@/datamodels/course.model";
import type { ICourse } from "@/datamodels/course.model";
import { v4 as uuidv4 } from "uuid";

/**
 * Main orchestrator for concept extraction process
 */
export class ConceptExtractor {
  private conceptManager: ConceptManager;
  private llmService: ConceptLLMService;
  private extractionCache: Map<number, ConceptReviewData> = new Map();

  /**
   * Initialize with optional services for dependency injection
   * @param conceptManager Optional concept manager implementation
   * @param llmService Optional LLM service implementation
   */
  constructor(conceptManager?: ConceptManager, llmService?: ConceptLLMService) {
    this.conceptManager = conceptManager || new ConceptManager();
    this.llmService = llmService || new ConceptLLMService();
  }

  /**
   * Extract concepts from a course and prepare for review
   * @param courseId ID of the course to extract concepts from
   * @returns Result of the extraction process
   */
  async extractConceptsFromCourse(courseId: number): Promise<ExtractionResult> {
    try {
      // 1. Fetch course data with validation
      const course = await this.fetchAndValidateCourse(courseId);

      // 2. Extract concepts using LLM
      const extractedConcepts = await this.llmService.extractConceptsFromCourse(
        {
          keywords: course.keywords,
          notes: course.notes,
          practice: course.practice,
          newWords: course.newWords,
          homework: course.homework,
        }
      );

      // 3. Check similarity against existing concepts
      const similarityMatches =
        await this.findSimilaritiesForAll(extractedConcepts);

      // 4. Update course with extraction status
      await this.updateCourseExtractionStatus(courseId, extractedConcepts);

      // 5. Prepare review data
      const extractionId = uuidv4();
      const reviewData: ConceptReviewData = {
        courseId,
        courseName: `Course ${courseId} - ${course.keywords.join(", ")}`,
        extractedConcepts,
        similarityMatches,
        totalExtracted: extractedConcepts.length,
        highConfidenceCount: extractedConcepts.filter((c) => c.confidence > 0.8)
          .length,
      };

      // Cache the review data
      this.extractionCache.set(courseId, reviewData);

      return {
        success: true,
        data: reviewData,
        extractionId,
      };
    } catch (error) {
      console.error("Concept extraction failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown extraction error",
      };
    }
  }

  /**
   * Fetch a course and validate required fields
   * @param courseId ID of the course to fetch
   * @returns Course data
   */
  private async fetchAndValidateCourse(courseId: number): Promise<ICourse> {
    // Fetch course from database
    const course = await Course.findOne({ courseId });

    if (!course) {
      throw new ConceptExtractionError(`Course with ID ${courseId} not found`);
    }

    // Validate required fields
    if (!course.notes || !course.practice || !course.keywords) {
      throw new ConceptExtractionError(
        `Course ${courseId} is missing required fields (notes, practice, or keywords)`
      );
    }

    return course.toObject();
  }

  /**
   * Find similarities for all extracted concepts
   * @param extractedConcepts Array of extracted concepts
   * @returns Map of concept name to similarity matches
   */
  private async findSimilaritiesForAll(
    extractedConcepts: ExtractedConcept[]
  ): Promise<Map<string, SimilarityMatch[]>> {
    const similarityMap = new Map<string, SimilarityMatch[]>();

    // Get the concept index once to avoid repeated fetches
    const conceptIndex = await this.conceptManager.getConceptIndex();

    // Process concepts in small batches to handle rate limiting
    const batchSize = 3;
    for (let i = 0; i < extractedConcepts.length; i += batchSize) {
      const batch = extractedConcepts.slice(i, i + batchSize);

      // Process batch in parallel
      const batchPromises = batch.map(async (concept) => {
        try {
          // Only check similarity if there are existing concepts
          if (conceptIndex.length > 0) {
            const matches = await this.llmService.checkConceptSimilarity(
              concept,
              conceptIndex
            );
            similarityMap.set(concept.name, matches);
          } else {
            similarityMap.set(concept.name, []);
          }
        } catch (error) {
          console.error(
            `Error finding similarities for concept "${concept.name}":`,
            error
          );
          similarityMap.set(concept.name, []);
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);

      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < extractedConcepts.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return similarityMap;
  }

  /**
   * Update course extraction status in the database
   * @param courseId ID of the course
   * @param extractedConcepts Array of extracted concepts
   */
  private async updateCourseExtractionStatus(
    courseId: number,
    extractedConcepts: ExtractedConcept[]
  ): Promise<void> {
    try {
      await Course.updateOne(
        { courseId },
        {
          $set: {
            conceptExtractionStatus: ConceptExtractionStatus.COMPLETED,
            conceptExtractionDate: new Date(),
            extractedConcepts: extractedConcepts.map((c) => c.name),
          },
        }
      );
    } catch (error) {
      console.error(
        `Failed to update extraction status for course ${courseId}:`,
        error
      );
      // Non-fatal error, don't throw
    }
  }

  /**
   * Get review data for a course
   * @param courseId ID of the course
   * @returns Review data or null if not found
   */
  async prepareReviewData(courseId: number): Promise<ConceptReviewData | null> {
    // Check cache first
    if (this.extractionCache.has(courseId)) {
      return this.extractionCache.get(courseId) || null;
    }

    // If not in cache, check if course has been extracted
    const course = await Course.findOne({
      courseId,
      conceptExtractionStatus: ConceptExtractionStatus.COMPLETED,
    });

    if (!course) {
      return null;
    }

    // Re-extract concepts to rebuild review data
    const extractionResult = await this.extractConceptsFromCourse(courseId);
    return extractionResult.data || null;
  }

  /**
   * Apply reviewed concepts to the database
   * @param courseId ID of the course
   * @param approvedConcepts Array of reviewed and approved concepts
   * @returns Success status and count of concepts created
   */
  async applyReviewedConcepts(
    courseId: number,
    approvedConcepts: Array<{
      concept: ExtractedConcept;
      action: "create" | "merge";
      mergeWithId?: string;
    }>
  ): Promise<{
    success: boolean;
    created: number;
    merged: number;
    errors: string[];
  }> {
    const results = {
      success: true,
      created: 0,
      merged: 0,
      errors: [] as string[],
    };

    try {
      // Get course data
      const course = await Course.findOne({ courseId });
      if (!course) {
        throw new ConceptExtractionError(
          `Course with ID ${courseId} not found`
        );
      }

      // Process each approved concept
      for (const { concept, action, mergeWithId } of approvedConcepts) {
        try {
          if (action === "create") {
            // Create new concept
            const newConcept = await this.conceptManager.createConcept({
              id: uuidv4(),
              name: concept.name,
              category: concept.category,
              description: concept.description,
              examples: concept.examples,
              difficulty: concept.suggestedDifficulty,
              confidence: concept.confidence,
              createdFrom: [courseId.toString()],
              isActive: true,
              lastUpdated: new Date(),
            });

            // Link to course
            await this.conceptManager.linkConceptToCourse(
              newConcept.id,
              courseId,
              concept.confidence,
              concept.sourceContent
            );

            results.created++;
          } else if (action === "merge" && mergeWithId) {
            // Add course to existing concept's createdFrom list
            const existingConcept =
              await this.conceptManager.getConcept(mergeWithId);
            if (existingConcept) {
              const createdFrom = [...(existingConcept.createdFrom || [])];
              if (!createdFrom.includes(courseId.toString())) {
                createdFrom.push(courseId.toString());
                await this.conceptManager.updateConcept(mergeWithId, {
                  createdFrom,
                  lastUpdated: new Date(),
                });
              }

              // Link to course
              await this.conceptManager.linkConceptToCourse(
                mergeWithId,
                courseId,
                concept.confidence,
                concept.sourceContent
              );

              results.merged++;
            } else {
              results.errors.push(
                `Concept with ID ${mergeWithId} not found for merging`
              );
            }
          }
        } catch (error) {
          const errorMessage = `Error processing concept "${concept.name}": ${error instanceof Error ? error.message : String(error)}`;
          results.errors.push(errorMessage);
          console.error(errorMessage);
        }
      }

      // Update course status to REVIEWED
      await Course.updateOne(
        { courseId },
        {
          $set: {
            conceptExtractionStatus: ConceptExtractionStatus.REVIEWED,
          },
        }
      );

      // Clear cache for this course
      this.extractionCache.delete(courseId);

      return results;
    } catch (error) {
      results.success = false;
      results.errors.push(
        `Failed to apply reviewed concepts: ${error instanceof Error ? error.message : String(error)}`
      );
      return results;
    }
  }
}

/**
 * Factory function for dependency injection
 * @param conceptManager Optional concept manager implementation
 * @param llmService Optional LLM service implementation
 * @returns ConceptExtractor instance
 */
export function createConceptExtractor(
  conceptManager?: ConceptManager,
  llmService?: ConceptLLMService
): ConceptExtractor {
  return new ConceptExtractor(conceptManager, llmService);
}
