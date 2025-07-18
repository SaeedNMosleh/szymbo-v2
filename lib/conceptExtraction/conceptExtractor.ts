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
import ConceptExtractionSession, {
  IConceptExtractionSession,
  SimilarityData,
  ReviewProgress,
} from "@/datamodels/conceptExtractionSession.model";
import { v4 as uuidv4 } from "uuid";

/**
 * Main orchestrator for concept extraction process
 */
export class ConceptExtractor {
  private conceptManager: ConceptManager;
  private llmService: ConceptLLMService;

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

      // 5. Create extraction session in database
      const extractionId = uuidv4();
      const sessionData: IConceptExtractionSession = {
        id: extractionId,
        courseId,
        courseName: `Course ${courseId} - ${course.keywords.join(", ")}`,
        extractionDate: new Date(),
        status: "extracted",
        extractedConcepts: extractedConcepts.map((concept) => ({
          ...concept,
          extractionMetadata: {
            model: "current-llm-model", // TODO: Get from LLM service
            timestamp: new Date(),
            processingTime: 0, // TODO: Track actual processing time
          },
        })),
        similarityMatches: Array.from(similarityMatches.entries()).map(
          ([name, matches]: [string, SimilarityMatch[]]) => ({
            extractedConceptName: name,
            matches: matches.map((match) => ({
              ...match,
              examples: match.examples || [],
            })),
          })
        ),
        reviewProgress: {
          totalConcepts: extractedConcepts.length,
          reviewedCount: 0,
          decisions: [],
          isDraft: true,
        },
        newTagsCreated: [],
        extractionMetadata: {
          llmModel: "current-llm-model", // TODO: Get from LLM service
          totalProcessingTime: 0, // TODO: Track actual processing time
          extractionConfidence:
            extractedConcepts.reduce((sum, c) => sum + c.confidence, 0) /
            extractedConcepts.length,
          sourceContentLength:
            (course.notes?.length || 0) + (course.practice?.length || 0),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to database
      await ConceptExtractionSession.create(sessionData);

      // Prepare review data for backward compatibility
      const reviewData: ConceptReviewData = {
        courseId,
        courseName: `Course ${courseId} - ${course.keywords.join(", ")}`,
        extractedConcepts,
        similarityMatches,
        totalExtracted: extractedConcepts.length,
        highConfidenceCount: extractedConcepts.filter((c) => c.confidence > 0.8)
          .length,
      };

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
   * Get review data for a course from database session
   * @param courseId ID of the course
   * @returns Review data or null if not found
   */
  async prepareReviewData(courseId: number): Promise<ConceptReviewData | null> {
    // Check for existing extraction session first
    const session = await ConceptExtractionSession.findOne({
      courseId,
      status: { $in: ["extracted", "in_review"] },
    }).sort({ extractionDate: -1 });

    if (session) {
      // Convert session data to review data format
      const similarityMap = new Map<string, SimilarityMatch[]>();
      session.similarityMatches.forEach((data: SimilarityData) => {
        similarityMap.set(data.extractedConceptName, data.matches);
      });

      return {
        courseId: session.courseId,
        courseName: session.courseName,
        extractedConcepts: session.extractedConcepts,
        similarityMatches: similarityMap,
        totalExtracted: session.extractedConcepts.length,
        highConfidenceCount: session.extractedConcepts.filter(
          (c: ExtractedConcept) => c.confidence > 0.8
        ).length,
      };
    }

    // If no session exists, check if course has been extracted
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
   * Get extraction session by ID
   * @param sessionId ID of the extraction session
   * @returns Extraction session or null if not found
   */
  async getExtractionSession(
    sessionId: string
  ): Promise<IConceptExtractionSession | null> {
    return await ConceptExtractionSession.findOne({ id: sessionId });
  }

  /**
   * Get latest extraction session for a course
   * @param courseId ID of the course
   * @returns Latest extraction session or null if not found
   */
  async getLatestExtractionSession(
    courseId: number
  ): Promise<IConceptExtractionSession | null> {
    return await ConceptExtractionSession.findOne({
      courseId,
      status: { $in: ["extracted", "in_review"] },
    }).sort({ extractionDate: -1 });
  }

  /**
   * Update extraction session progress
   * @param sessionId ID of the extraction session
   * @param progress Updated progress data
   */
  async updateSessionProgress(
    sessionId: string,
    progress: Partial<ReviewProgress>
  ): Promise<void> {
    await ConceptExtractionSession.updateOne(
      { id: sessionId },
      {
        $set: {
          reviewProgress: progress,
          updatedAt: new Date(),
          status: progress.isDraft ? "in_review" : "reviewed",
        },
      }
    );
  }

  /**
   * Apply reviewed concepts to the database with enhanced duplicate handling
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
            // Use createOrFindConcept to handle potential duplicates gracefully
            const newConcept = await this.conceptManager.createOrFindConcept({
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
            console.log(`Successfully processed concept: ${concept.name}`);
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

          // Don't fail the entire operation for individual concept errors
          // Continue processing remaining concepts
        }
      }

      // Update course status to REVIEWED only if we had some success
      if (results.created > 0 || results.merged > 0) {
        try {
          await Course.updateOne(
            { courseId },
            {
              $set: {
                conceptExtractionStatus: ConceptExtractionStatus.REVIEWED,
              },
            }
          );
          console.log(`Updated course ${courseId} status to REVIEWED`);
        } catch (statusError) {
          console.error(`Failed to update course status:`, statusError);
          results.errors.push("Failed to update course status");
        }
      }

      // Archive the extraction session
      await ConceptExtractionSession.updateOne(
        { courseId, status: { $in: ["extracted", "in_review", "reviewed"] } },
        { $set: { status: "archived", updatedAt: new Date() } }
      );

      // Set success to false only if we had no successes and errors
      if (
        results.created === 0 &&
        results.merged === 0 &&
        results.errors.length > 0
      ) {
        results.success = false;
      }

      console.log(`Concept application results:`, {
        courseId,
        created: results.created,
        merged: results.merged,
        errors: results.errors.length,
      });

      return results;
    } catch (error) {
      results.success = false;
      results.errors.push(
        `Failed to apply reviewed concepts: ${error instanceof Error ? error.message : String(error)}`
      );
      console.error("Critical error in applyReviewedConcepts:", error);
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
