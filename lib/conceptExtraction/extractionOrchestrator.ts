import { ConceptLLMService } from "./conceptLLM";
import { ConceptManager } from "./conceptManager";
import { createContentChunker } from "./contentChunker";
import ConceptExtractionSession, {
  SimilarityData,
} from "@/datamodels/conceptExtractionSession.model";
import Course from "@/datamodels/course.model";
import { ExtractedConcept, SimilarityMatch } from "./types";
import { logger } from "@/lib/utils/logger";
import { ConceptExtractionStatus } from "@/lib/enum";
import { v4 as uuidv4 } from "uuid";

interface ExtractionStatistics {
  totalConcepts: number;
  highConfidenceCount: number;
  averageConfidence: number;
  processingTime: number;
  chunksProcessed: number;
}

interface ExtractionResult {
  extractionId: string;
  statistics: ExtractionStatistics;
  canProceedToReview: boolean;
}

/**
 * Service for orchestrating the complete chunked extraction workflow
 * This provides a more reliable alternative to HTTP-based orchestration
 */
export class ExtractionOrchestrator {
  private llmService: ConceptLLMService;
  private conceptManager: ConceptManager;

  constructor() {
    this.llmService = new ConceptLLMService();
    this.conceptManager = new ConceptManager();
  }

  /**
   * Execute complete chunked extraction workflow
   */
  async executeChunkedExtraction(courseId: number): Promise<{
    success: boolean;
    extractionId?: string;
    error?: string;
    data?: ExtractionResult;
  }> {
    let extractionId: string | null = null;

    try {
      logger.info("Starting orchestrated chunked extraction", {
        operation: "orchestrated_extraction",
        courseId,
      });

      // Step 1: Analyze content and create session
      const {
        success: analyzeSuccess,
        extractionId: newExtractionId,
        error: analyzeError,
      } = await this.analyzeContent(courseId);

      if (!analyzeSuccess || !newExtractionId) {
        return {
          success: false,
          error: analyzeError || "Content analysis failed",
        };
      }

      extractionId = newExtractionId;

      // Step 2: Process all chunks
      const { success: processSuccess, error: processError } =
        await this.processAllChunks(extractionId);

      if (!processSuccess) {
        return {
          success: false,
          extractionId,
          error: processError || "Chunk processing failed",
        };
      }

      // Step 3: Process similarity checking
      const { success: similaritySuccess, error: similarityError } =
        await this.processSimilarityChecking(extractionId);

      if (!similaritySuccess) {
        return {
          success: false,
          extractionId,
          error: similarityError || "Similarity processing failed",
        };
      }

      // Step 4: Finalize extraction
      const {
        success: finalizeSuccess,
        data: finalizeData,
        error: finalizeError,
      } = await this.finalizeExtraction(extractionId);

      if (!finalizeSuccess) {
        return {
          success: false,
          extractionId,
          error: finalizeError || "Finalization failed",
        };
      }

      logger.success("Orchestrated chunked extraction completed", {
        operation: "orchestrated_extraction",
        courseId,
        extractionId,
        totalConcepts: finalizeData?.statistics?.totalConcepts,
      });

      return {
        success: true,
        extractionId,
        data: finalizeData,
      };
    } catch (error) {
      logger.error("Orchestrated extraction failed", error as Error);

      // Update session with error if we have an extractionId
      if (extractionId) {
        try {
          await this.updateSessionWithError(
            extractionId,
            error instanceof Error ? error.message : "Unknown error"
          );
        } catch (updateError) {
          logger.error(
            "Failed to update session with error",
            updateError as Error
          );
        }
      }

      return {
        success: false,
        extractionId: extractionId || undefined,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Analyze content and create extraction session
   */
  private async analyzeContent(courseId: number): Promise<{
    success: boolean;
    extractionId?: string;
    error?: string;
  }> {
    try {
      // Fetch course data
      const course = await Course.findOne({ courseId });
      if (!course) {
        return {
          success: false,
          error: `Course with ID ${courseId} not found`,
        };
      }

      // Validate required fields
      if (!course.notes || !course.practice || !course.keywords) {
        return {
          success: false,
          error: `Course ${courseId} is missing required fields (notes, practice, or keywords)`,
        };
      }

      // Check for existing active session
      const existingSession = await ConceptExtractionSession.findOne({
        courseId,
        status: { $in: ["analyzing", "extracting", "similarity_checking"] },
      });

      if (existingSession) {
        return {
          success: false,
          error: "Extraction already in progress for this course",
        };
      }

      // Analyze content
      const chunker = createContentChunker();
      const analysis = await chunker.analyzeCourseContent(course.toObject());

      // Create extraction session
      const extractionId = uuidv4();
      const sessionData = {
        id: extractionId,
        courseId,
        courseName: `Course ${courseId} - ${course.keywords.join(", ")}`,
        extractionDate: new Date(),
        status: "analyzing" as const,
        extractedConcepts: [],
        similarityMatches: [],
        reviewProgress: {
          totalConcepts: 0,
          reviewedCount: 0,
          decisions: [],
          isDraft: true,
        },
        extractionProgress: {
          phase: "analyzing" as const,
          totalChunks: analysis.recommendedChunks.length,
          processedChunks: 0,
          totalConcepts: analysis.recommendedChunks.reduce(
            (sum, chunk) => sum + chunk.estimatedConcepts,
            0
          ),
          extractedConcepts: 0,
          similarityChecked: 0,
          estimatedTimeRemaining: analysis.estimatedProcessingTime,
          currentOperation: "Content analysis completed",
          chunks: analysis.recommendedChunks,
          lastUpdated: new Date(),
        },
        newTagsCreated: [],
        extractionMetadata: {
          llmModel: "gpt-4.1-nano",
          totalProcessingTime: 0,
          extractionConfidence: 0,
          sourceContentLength: analysis.totalContentLength,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await ConceptExtractionSession.create(sessionData);

      return { success: true, extractionId };
    } catch (error) {
      logger.error("Content analysis failed", error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Process all chunks for an extraction session
   */
  private async processAllChunks(extractionId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get session
      const session = await ConceptExtractionSession.findOne({
        id: extractionId,
      });
      if (!session || !session.extractionProgress) {
        return { success: false, error: "Extraction session not found" };
      }

      // Update to extracting phase
      await ConceptExtractionSession.updateOne(
        { id: extractionId },
        {
          $set: {
            status: "extracting",
            "extractionProgress.phase": "extracting",
            "extractionProgress.currentOperation": "Starting chunk processing",
            "extractionProgress.lastUpdated": new Date(),
          },
        }
      );

      const chunks = session.extractionProgress.chunks;
      const allExtractedConcepts: ExtractedConcept[] = [];

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const startTime = Date.now();

        logger.info(`Processing chunk ${i + 1}/${chunks.length}`, {
          operation: "chunk_processing",
          extractionId,
          chunkId: chunk.id,
          chunkType: chunk.type,
        });

        // Update progress
        await ConceptExtractionSession.updateOne(
          { id: extractionId },
          {
            $set: {
              "extractionProgress.currentOperation": `Processing ${chunk.type} content (${i + 1}/${chunks.length})`,
              "extractionProgress.lastUpdated": new Date(),
            },
          }
        );

        // Prepare content for LLM
        const contentToProcess = {
          keywords: chunk.type === "keywords" ? chunk.content.split(", ") : [],
          notes: chunk.type === "notes" ? chunk.content : "",
          practice: chunk.type === "practice" ? chunk.content : "",
          newWords: chunk.type === "keywords" ? chunk.content.split(", ") : [],
          homework: chunk.type === "homework" ? chunk.content : undefined,
        };

        // Extract concepts
        const extractedConcepts =
          await this.llmService.extractConceptsFromCourse(contentToProcess);
        allExtractedConcepts.push(...extractedConcepts);

        const processingTime = Date.now() - startTime;

        // Update chunk as processed
        chunks[i] = {
          ...chunk,
          processed: true,
          extractedConcepts,
          processedAt: new Date(),
          processingTime,
        };

        // Update session with progress
        await ConceptExtractionSession.updateOne(
          { id: extractionId },
          {
            $set: {
              extractedConcepts: allExtractedConcepts,
              "extractionProgress.chunks": chunks,
              "extractionProgress.processedChunks": i + 1,
              "extractionProgress.extractedConcepts":
                allExtractedConcepts.length,
              "extractionProgress.lastUpdated": new Date(),
            },
          }
        );

        // Add delay to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      // Move to similarity checking phase
      await ConceptExtractionSession.updateOne(
        { id: extractionId },
        {
          $set: {
            status: "similarity_checking",
            "extractionProgress.phase": "similarity_checking",
            "extractionProgress.currentOperation":
              "Starting similarity analysis",
            "extractionProgress.lastUpdated": new Date(),
          },
        }
      );

      return { success: true };
    } catch (error) {
      logger.error("Chunk processing failed", error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Process similarity checking for all concepts
   */
  private async processSimilarityChecking(extractionId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get session
      const session = await ConceptExtractionSession.findOne({
        id: extractionId,
      });
      if (!session) {
        return { success: false, error: "Extraction session not found" };
      }

      const conceptIndex = await this.conceptManager.getConceptIndex();
      const extractedConcepts = session.extractedConcepts;
      const batchSize = 3;
      const similarityMatches: SimilarityData[] = [];

      // Process concepts in batches
      for (let i = 0; i < extractedConcepts.length; i += batchSize) {
        const batch = extractedConcepts.slice(i, i + batchSize);

        // Update progress
        await ConceptExtractionSession.updateOne(
          { id: extractionId },
          {
            $set: {
              "extractionProgress.currentOperation": `Checking similarity for concepts ${i + 1}-${Math.min(i + batchSize, extractedConcepts.length)} of ${extractedConcepts.length}`,
              "extractionProgress.lastUpdated": new Date(),
            },
          }
        );

        // Process batch
        for (const concept of batch) {
          try {
            let matches: SimilarityMatch[] = [];

            if (conceptIndex.length > 0) {
              matches = await this.llmService.checkConceptSimilarity(
                concept,
                conceptIndex
              );
            }

            similarityMatches.push({
              extractedConceptName: concept.name,
              matches,
            });
          } catch (error) {
            logger.error(
              `Error checking similarity for concept "${concept.name}"`,
              error as Error
            );
            similarityMatches.push({
              extractedConceptName: concept.name,
              matches: [],
            });
          }
        }

        // Update progress
        await ConceptExtractionSession.updateOne(
          { id: extractionId },
          {
            $set: {
              similarityMatches,
              "extractionProgress.similarityChecked": Math.min(
                i + batchSize,
                extractedConcepts.length
              ),
              "extractionProgress.lastUpdated": new Date(),
            },
          }
        );

        // Add delay between batches
        if (i + batchSize < extractedConcepts.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      return { success: true };
    } catch (error) {
      logger.error("Similarity processing failed", error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Finalize extraction and prepare for review
   */
  private async finalizeExtraction(extractionId: string): Promise<{
    success: boolean;
    data?: ExtractionResult;
    error?: string;
  }> {
    try {
      const session = await ConceptExtractionSession.findOne({
        id: extractionId,
      });
      if (!session) {
        return { success: false, error: "Extraction session not found" };
      }

      const totalConcepts = session.extractedConcepts.length;
      const extractionConfidence =
        totalConcepts > 0
          ? session.extractedConcepts.reduce(
              (sum: number, c: ExtractedConcept) => sum + c.confidence,
              0
            ) / totalConcepts
          : 0;

      // Update session to finalized state
      await ConceptExtractionSession.updateOne(
        { id: extractionId },
        {
          $set: {
            status: "extracted",
            "extractionProgress.phase": "completed",
            "extractionProgress.currentOperation":
              "Extraction completed successfully",
            "extractionProgress.lastUpdated": new Date(),
            "reviewProgress.totalConcepts": totalConcepts,
            "extractionMetadata.extractionConfidence": extractionConfidence,
            "extractionMetadata.totalProcessingTime":
              Date.now() - session.extractionDate.getTime(),
            updatedAt: new Date(),
          },
        }
      );

      // Update course status
      await Course.updateOne(
        { courseId: session.courseId },
        {
          $set: {
            conceptExtractionStatus: ConceptExtractionStatus.EXTRACTED,
            conceptExtractionDate: new Date(),
            extractedConcepts: session.extractedConcepts.map(
              (c: ExtractedConcept) => c.name
            ),
          },
        }
      );

      // Prepare response data
      const statistics = {
        totalConcepts,
        highConfidenceCount: session.extractedConcepts.filter(
          (c: ExtractedConcept) => c.confidence > 0.8
        ).length,
        averageConfidence: Math.round(extractionConfidence * 100) / 100,
        processingTime: Math.round(
          (Date.now() - session.extractionDate.getTime()) / 1000
        ),
        chunksProcessed: session.extractionProgress?.totalChunks || 0,
      };

      return {
        success: true,
        data: {
          extractionId,
          statistics,
          canProceedToReview: true,
        },
      };
    } catch (error) {
      logger.error("Finalization failed", error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update session with error status
   */
  private async updateSessionWithError(
    extractionId: string,
    errorMessage: string
  ): Promise<void> {
    await ConceptExtractionSession.updateOne(
      { id: extractionId },
      {
        $set: {
          status: "error",
          "extractionProgress.phase": "error",
          "extractionProgress.errorMessage": errorMessage,
          "extractionProgress.lastUpdated": new Date(),
        },
      }
    );
  }
}
