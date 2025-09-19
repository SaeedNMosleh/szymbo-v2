import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptLLMService } from "@/lib/conceptExtraction/conceptLLM";
import ConceptExtractionSession, {
  type ExtractedConcept,
  type IConceptExtractionSession,
  type ContentChunk,
} from "@/datamodels/conceptExtractionSession.model";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";

const processRequestSchema = z.object({
  extractionId: z.string().min(1),
  chunkId: z.string().min(1),
});

// Type for MongoDB update operations
interface ProcessUpdateData {
  extractedConcepts: ExtractedConcept[];
  "extractionProgress.chunks": ContentChunk[];
  "extractionProgress.processedChunks": number;
  "extractionProgress.extractedConcepts": number;
  "extractionProgress.currentOperation": string;
  "extractionProgress.lastUpdated": Date;
  updatedAt: Date;
  status?: string;
  "extractionProgress.phase"?: string;
}

/**
 * POST /api/concepts/extract/process
 * Process a single content chunk to extract concepts
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const { extractionId, chunkId } = processRequestSchema.parse(body);

    logger.info("Starting chunk processing", {
      operation: "chunk_processing",
      extractionId,
      chunkId,
    });

    // Find extraction session
    const session = await ConceptExtractionSession.findOne({
      id: extractionId,
    }) as IConceptExtractionSession | null;

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Extraction session not found",
        },
        { status: 404 }
      );
    }

    // Validate session status
    if (!["analyzing", "extracting"].includes(session.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot process chunks in status: ${session.status}`,
        },
        { status: 400 }
      );
    }

    // Find the specific chunk
    const chunk = session.extractionProgress?.chunks.find((c: ContentChunk) => c.id === chunkId);
    if (!chunk) {
      return NextResponse.json(
        {
          success: false,
          error: "Chunk not found in extraction session",
        },
        { status: 404 }
      );
    }

    // Check if chunk is already processed
    if (chunk.processed) {
      return NextResponse.json(
        {
          success: false,
          error: "Chunk has already been processed",
        },
        { status: 409 }
      );
    }

    // Update session to extracting phase if not already
    if (session.status === "analyzing") {
      await ConceptExtractionSession.updateOne(
        { id: extractionId },
        {
          $set: {
            status: "extracting",
            "extractionProgress.phase": "extracting",
            "extractionProgress.currentOperation": `Processing ${chunk.type} content`,
            "extractionProgress.lastUpdated": new Date(),
          },
        }
      );
    }

    // Prepare content for LLM processing
    const contentToProcess = {
      keywords: chunk.type === 'keywords' ? chunk.content.split(', ') : [],
      notes: chunk.type === 'notes' ? chunk.content : '',
      practice: chunk.type === 'practice' ? chunk.content : '',
      newWords: [] as string[], // Will be populated from keywords if applicable
      homework: chunk.type === 'homework' ? chunk.content : undefined,
    };

    // If keywords chunk, treat them as new words too
    if (chunk.type === 'keywords') {
      contentToProcess.newWords = contentToProcess.keywords;
    }

    // Extract concepts using LLM service
    const llmService = new ConceptLLMService();
    const extractedConcepts = await llmService.extractConceptsFromCourse(contentToProcess);

    const processingTime = Date.now() - startTime;

    // Update chunk as processed
    const updatedChunks = session.extractionProgress!.chunks.map((c: ContentChunk) => {
      if (c.id === chunkId) {
        return {
          ...c,
          processed: true,
          extractedConcepts,
          processedAt: new Date(),
          processingTime,
        };
      }
      return c;
    });

    // Calculate updated progress
    const processedChunks = updatedChunks.filter((c: ContentChunk) => c.processed).length;
    const totalExtractedConcepts = updatedChunks.reduce((sum: number, c: ContentChunk) => {
      return sum + (c.extractedConcepts?.length || 0);
    }, 0);

    // Add extracted concepts to session
    const allExtractedConcepts = [
      ...session.extractedConcepts,
      ...extractedConcepts,
    ];

    // Update session with progress
    const updateData: ProcessUpdateData = {
      extractedConcepts: allExtractedConcepts,
      "extractionProgress.chunks": updatedChunks,
      "extractionProgress.processedChunks": processedChunks,
      "extractionProgress.extractedConcepts": totalExtractedConcepts,
      "extractionProgress.currentOperation":
        processedChunks < updatedChunks.length
          ? `Processed chunk ${processedChunks}/${updatedChunks.length}`
          : "All chunks processed, preparing for similarity checking",
      "extractionProgress.lastUpdated": new Date(),
      updatedAt: new Date(),
    };

    // Check if all chunks are processed
    if (processedChunks === updatedChunks.length) {
      // Move to similarity checking phase
      updateData.status = "similarity_checking";
      updateData["extractionProgress.phase"] = "similarity_checking";
      updateData["extractionProgress.currentOperation"] = "Starting similarity analysis";
    }

    await ConceptExtractionSession.updateOne(
      { id: extractionId },
      { $set: updateData }
    );

    logger.success("Chunk processing completed", {
      operation: "chunk_processing",
      extractionId,
      chunkId,
      extractedConceptsCount: extractedConcepts.length,
      processingTime,
      totalProcessedChunks: processedChunks,
      totalChunks: updatedChunks.length,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          extractionId,
          chunkId,
          extractedConcepts: extractedConcepts.length,
          totalExtractedConcepts,
          progress: {
            processedChunks,
            totalChunks: updatedChunks.length,
            percentage: Math.round((processedChunks / updatedChunks.length) * 100),
          },
          nextPhase: processedChunks === updatedChunks.length ? "similarity_checking" : "extracting",
        },
        message: `Processed chunk ${processedChunks}/${updatedChunks.length}: ${extractedConcepts.length} concepts extracted`,
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

    logger.error("Chunk processing failed", error as Error);

    // Try to update session with error status
    try {
      const { extractionId } = processRequestSchema.parse(await request.json());
      await ConceptExtractionSession.updateOne(
        { id: extractionId },
        {
          $set: {
            status: "error",
            "extractionProgress.phase": "error",
            "extractionProgress.errorMessage": error instanceof Error ? error.message : "Unknown error",
            "extractionProgress.lastUpdated": new Date(),
          },
        }
      );
    } catch (updateError) {
      logger.error("Failed to update session with error status", updateError as Error);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Chunk processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}