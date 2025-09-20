import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptLLMService } from "@/lib/conceptExtraction/conceptLLM";
import { ConceptManager } from "@/lib/conceptExtraction/conceptManager";
import ConceptExtractionSession, {
  ExtractedConcept,
  SimilarityData,
} from "@/datamodels/conceptExtractionSession.model";
import Course from "@/datamodels/course.model";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";
import { v4 as uuidv4 } from "uuid";

const extractionRequestSchema = z.object({
  courseId: z.number().int().positive(),
});

/**
 * POST /api/concepts/extract
 * Simplified concept extraction workflow
 *
 * This endpoint handles the complete extraction process:
 * 1. Extract vocabulary concepts from newWords
 * 2. Extract grammar concepts from notes/practice/homework
 * 3. Perform smart similarity checking
 * 4. Return session ready for review
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let extractionId: string | undefined;

  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const { courseId } = extractionRequestSchema.parse(body);

    logger.info("Starting simplified concept extraction", {
      operation: "simplified_extraction_start",
      courseId,
    });

    // Check for existing extraction session
    const existingSession = await ConceptExtractionSession.findOne({
      courseId,
      status: { $in: ["extracting", "reviewing"] },
    });

    if (existingSession) {
      return NextResponse.json(
        {
          success: false,
          error: "Extraction already in progress for this course",
          extractionId: existingSession.id,
        },
        { status: 409 }
      );
    }

    // Get course data
    const course = await Course.findOne({ courseId });
    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: "Course not found",
        },
        { status: 404 }
      );
    }

    // Validate course has required content
    if (!course.newWords?.length && !course.notes && !course.practice) {
      return NextResponse.json(
        {
          success: false,
          error: "Course must have newWords, notes, or practice content",
        },
        { status: 400 }
      );
    }

    // Create extraction session
    extractionId = uuidv4();
    const session = new ConceptExtractionSession({
      id: extractionId,
      courseId,
      courseName: course.title || `Course ${courseId}`,
      extractionDate: new Date(),
      status: "extracting",
      extractedConcepts: [],
      similarityMatches: [],
      reviewProgress: {
        totalConcepts: 0,
        reviewedCount: 0,
        decisions: [],
        isDraft: true,
      },
      extractionProgress: {
        currentOperation: "Starting extraction",
        lastUpdated: new Date(),
      },
      newTagsCreated: [],
      extractionMetadata: {
        llmModel: "gpt-4",
        totalProcessingTime: 0,
        extractionConfidence: 0,
        sourceContentLength: 0,
      },
    });

    await session.save();

    // Initialize services
    const llmService = new ConceptLLMService();
    const conceptManager = new ConceptManager();

    // Get existing tags for consistency
    const existingTags = await conceptManager.getExistingTags();

    let allExtractedConcepts: ExtractedConcept[] = [];

    // Step 1: Extract vocabulary concepts
    if (course.newWords && course.newWords.length > 0) {
      await ConceptExtractionSession.updateOne(
        { id: extractionId },
        {
          $set: {
            "extractionProgress.currentOperation": `Extracting vocabulary from ${course.newWords.length} words`,
            "extractionProgress.lastUpdated": new Date(),
          },
        }
      );

      logger.info("Extracting vocabulary concepts", {
        operation: "vocabulary_extraction",
        extractionId,
        wordCount: course.newWords.length,
      });

      try {
        const vocabularyConcepts = await llmService.extractVocabularyConcepts(
          course.newWords,
          existingTags
        );
        allExtractedConcepts = [...allExtractedConcepts, ...vocabularyConcepts];

        logger.info("Vocabulary extraction completed", {
          operation: "vocabulary_extraction",
          extractionId,
          conceptsExtracted: vocabularyConcepts.length,
        });
      } catch (error) {
        logger.error("Vocabulary extraction failed", error as Error);
        // Continue with grammar extraction even if vocabulary fails
      }
    }

    // Step 2: Extract grammar concepts
    const hasGrammarContent = course.notes || course.practice || course.homework;
    if (hasGrammarContent) {
      await ConceptExtractionSession.updateOne(
        { id: extractionId },
        {
          $set: {
            "extractionProgress.currentOperation": "Extracting grammar concepts",
            "extractionProgress.lastUpdated": new Date(),
          },
        }
      );

      logger.info("Extracting grammar concepts", {
        operation: "grammar_extraction",
        extractionId,
      });

      try {
        const grammarConcepts = await llmService.extractGrammarConcepts(
          {
            notes: course.notes || "",
            practice: course.practice || "",
            homework: course.homework,
          },
          existingTags
        );
        allExtractedConcepts = [...allExtractedConcepts, ...grammarConcepts];

        logger.info("Grammar extraction completed", {
          operation: "grammar_extraction",
          extractionId,
          conceptsExtracted: grammarConcepts.length,
        });
      } catch (error) {
        logger.error("Grammar extraction failed", error as Error);
        // Continue even if grammar extraction fails
      }
    }

    if (allExtractedConcepts.length === 0) {
      await ConceptExtractionSession.updateOne(
        { id: extractionId },
        {
          $set: {
            status: "error",
            "extractionProgress.errorMessage": "No concepts could be extracted",
            "extractionProgress.lastUpdated": new Date(),
          },
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: "No concepts could be extracted from course content",
          extractionId,
        },
        { status: 400 }
      );
    }

    // Step 3: Smart similarity checking
    await ConceptExtractionSession.updateOne(
      { id: extractionId },
      {
        $set: {
          "extractionProgress.currentOperation": `Checking similarity for ${allExtractedConcepts.length} concepts`,
          "extractionProgress.lastUpdated": new Date(),
        },
      }
    );

    logger.info("Starting smart similarity checking", {
      operation: "similarity_checking",
      extractionId,
      conceptCount: allExtractedConcepts.length,
    });

    const similarityMatches: SimilarityData[] = [];

    for (const concept of allExtractedConcepts) {
      try {
        // Get relevant concepts using smart filtering
        const relevantConcepts = await conceptManager.getRelevantConceptsForSimilarity(concept);

        if (relevantConcepts.length > 0) {
          const matches = await llmService.checkConceptSimilarity(
            concept,
            relevantConcepts
          );

          if (matches.length > 0) {
            similarityMatches.push({
              extractedConceptName: concept.name,
              matches,
            });
          }
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        logger.error(
          `Similarity check failed for concept "${concept.name}"`,
          error as Error
        );
        // Continue with other concepts
      }
    }

    // Step 4: Finalize session
    const processingTime = Date.now() - startTime;
    const extractionConfidence = allExtractedConcepts.length > 0
      ? allExtractedConcepts.reduce((sum, c) => sum + c.confidence, 0) / allExtractedConcepts.length
      : 0;

    await ConceptExtractionSession.updateOne(
      { id: extractionId },
      {
        $set: {
          status: "reviewing",
          extractedConcepts: allExtractedConcepts,
          similarityMatches,
          "reviewProgress.totalConcepts": allExtractedConcepts.length,
          "extractionProgress.currentOperation": "Extraction completed",
          "extractionProgress.lastUpdated": new Date(),
          "extractionMetadata.totalProcessingTime": processingTime,
          "extractionMetadata.extractionConfidence": extractionConfidence,
          "extractionMetadata.sourceContentLength":
            (course.notes?.length || 0) +
            (course.practice?.length || 0) +
            (course.homework?.length || 0) +
            (course.newWords?.join(' ').length || 0),
        },
      }
    );

    // Update course status to make it available for review
    await Course.updateOne(
      { courseId },
      { $set: { conceptExtractionStatus: "reviewing" } }
    );

    logger.success("Simplified extraction completed successfully", {
      operation: "simplified_extraction_complete",
      extractionId,
      courseId,
      totalConcepts: allExtractedConcepts.length,
      vocabularyConcepts: allExtractedConcepts.filter(c => c.category === "vocabulary").length,
      grammarConcepts: allExtractedConcepts.filter(c => c.category === "grammar").length,
      similarityMatches: similarityMatches.length,
      processingTime,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          extractionId,
          courseId,
          statistics: {
            totalConcepts: allExtractedConcepts.length,
            vocabularyConcepts: allExtractedConcepts.filter(c => c.category === "vocabulary").length,
            grammarConcepts: allExtractedConcepts.filter(c => c.category === "grammar").length,
            similarityMatches: similarityMatches.length,
            processingTime,
            extractionConfidence,
          },
          status: "reviewing",
        },
        message: `Extraction completed! ${allExtractedConcepts.length} concepts extracted and ready for review.`,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error("Simplified extraction failed", {
      operation: "simplified_extraction",
      extractionId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Try to update session with error status
    if (extractionId) {
      try {
        await ConceptExtractionSession.updateOne(
          { id: extractionId },
          {
            $set: {
              status: "error",
              "extractionProgress.errorMessage":
                error instanceof Error ? error.message : "Unknown error",
              "extractionProgress.lastUpdated": new Date(),
            },
          }
        );
      } catch (updateError) {
        logger.error("Failed to update session with error status", updateError as Error);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Concept extraction failed",
        details: error instanceof Error ? error.message : "Unknown error",
        extractionId,
      },
      { status: 500 }
    );
  }
}