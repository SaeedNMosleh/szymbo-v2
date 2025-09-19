import { ContentChunk } from "@/datamodels/conceptExtractionSession.model";
import { ICourse } from "@/datamodels/course.model";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/lib/utils/logger";

/**
 * Content analysis result with chunking recommendations
 */
export interface ContentAnalysis {
  totalContentLength: number;
  estimatedProcessingTime: number;
  recommendedChunks: ContentChunk[];
  analysisMetadata: {
    keywordsWeight: number;
    notesComplexity: number;
    practiceComplexity: number;
    homeworkComplexity?: number;
    estimatedConceptDensity: number;
  };
}

/**
 * Chunking configuration
 */
export interface ChunkingConfig {
  maxChunkSize: number;
  minChunkSize: number;
  overlapSize: number;
  preserveStructure: boolean;
  targetConceptsPerChunk: number;
}

/**
 * Service for analyzing and chunking course content for optimal LLM processing
 */
export class ContentChunker {
  private config: ChunkingConfig;

  constructor(config?: Partial<ChunkingConfig>) {
    this.config = {
      maxChunkSize: 3000, // Maximum characters per chunk to stay under token limits
      minChunkSize: 500,  // Minimum chunk size to maintain context
      overlapSize: 100,   // Character overlap between chunks for context
      preserveStructure: true, // Try to split at natural boundaries
      targetConceptsPerChunk: 5, // Aim for 5-7 concepts per chunk
      ...config,
    };
  }

  /**
   * Analyze course content and create chunking strategy
   */
  async analyzeCourseContent(course: ICourse): Promise<ContentAnalysis> {
    logger.info("Starting content analysis for chunking", {
      operation: "content_analysis",
      courseId: course.courseId,
      keywordCount: course.keywords?.length || 0,
      notesLength: course.notes?.length || 0,
      practiceLength: course.practice?.length || 0,
    });

    const chunks: ContentChunk[] = [];
    let totalContentLength = 0;
    let estimatedConcepts = 0;

    // Analyze keywords
    if (course.keywords && course.keywords.length > 0) {
      const keywordChunks = this.chunkKeywords(course.keywords);
      chunks.push(...keywordChunks);
      totalContentLength += keywordChunks.reduce((sum, chunk) => sum + chunk.content.length, 0);
      estimatedConcepts += keywordChunks.reduce((sum, chunk) => sum + chunk.estimatedConcepts, 0);
    }

    // Analyze notes
    if (course.notes && course.notes.length > 0) {
      const noteChunks = this.chunkTextContent(course.notes, 'notes');
      chunks.push(...noteChunks);
      totalContentLength += course.notes.length;
      estimatedConcepts += noteChunks.reduce((sum, chunk) => sum + chunk.estimatedConcepts, 0);
    }

    // Analyze practice content
    if (course.practice && course.practice.length > 0) {
      const practiceChunks = this.chunkTextContent(course.practice, 'practice');
      chunks.push(...practiceChunks);
      totalContentLength += course.practice.length;
      estimatedConcepts += practiceChunks.reduce((sum, chunk) => sum + chunk.estimatedConcepts, 0);
    }

    // Analyze homework if present
    if (course.homework && course.homework.length > 0) {
      const homeworkChunks = this.chunkTextContent(course.homework, 'homework');
      chunks.push(...homeworkChunks);
      totalContentLength += course.homework.length;
      estimatedConcepts += homeworkChunks.reduce((sum, chunk) => sum + chunk.estimatedConcepts, 0);
    }

    // Calculate complexity metrics
    const analysisMetadata = {
      keywordsWeight: this.calculateKeywordWeight(course.keywords),
      notesComplexity: this.calculateTextComplexity(course.notes),
      practiceComplexity: this.calculateTextComplexity(course.practice),
      homeworkComplexity: course.homework ? this.calculateTextComplexity(course.homework) : undefined,
      estimatedConceptDensity: estimatedConcepts / totalContentLength * 1000, // concepts per 1000 chars
    };

    // Estimate processing time (base on chunks and estimated concepts)
    const estimatedProcessingTime = this.estimateProcessingTime(chunks, estimatedConcepts);

    const analysis: ContentAnalysis = {
      totalContentLength,
      estimatedProcessingTime,
      recommendedChunks: chunks,
      analysisMetadata,
    };

    logger.success("Content analysis completed", {
      operation: "content_analysis",
      courseId: course.courseId,
      totalChunks: chunks.length,
      totalContentLength,
      estimatedConcepts,
      estimatedProcessingTime,
    });

    return analysis;
  }

  /**
   * Chunk keywords into manageable groups
   */
  private chunkKeywords(keywords: string[]): ContentChunk[] {
    const chunks: ContentChunk[] = [];

    // Group keywords by estimated concept potential
    const keywordGroups = this.groupKeywordsByRelatedness(keywords);

    for (let i = 0; i < keywordGroups.length; i++) {
      const group = keywordGroups[i];
      const content = group.join(', ');

      chunks.push({
        id: uuidv4(),
        type: 'keywords',
        content,
        estimatedConcepts: Math.max(1, Math.floor(group.length * 0.8)), // ~80% of keywords become concepts
        processed: false,
      });
    }

    return chunks;
  }

  /**
   * Chunk text content while preserving structure
   */
  private chunkTextContent(text: string, type: 'notes' | 'practice' | 'homework'): ContentChunk[] {
    const chunks: ContentChunk[] = [];

    if (text.length <= this.config.maxChunkSize) {
      // Single chunk if content is small enough
      chunks.push({
        id: uuidv4(),
        type,
        content: text.trim(),
        estimatedConcepts: this.estimateConceptsInText(text),
        processed: false,
      });
      return chunks;
    }

    // Split into multiple chunks
    const segments = this.smartSplit(text);

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      let chunkContent = segment;

      // Add overlap from previous chunk for context (except first chunk)
      if (i > 0 && this.config.overlapSize > 0) {
        const prevSegment = segments[i - 1];
        const overlap = prevSegment.slice(-this.config.overlapSize);
        chunkContent = overlap + '\n---\n' + segment;
      }

      chunks.push({
        id: uuidv4(),
        type,
        content: chunkContent.trim(),
        estimatedConcepts: this.estimateConceptsInText(segment),
        processed: false,
      });
    }

    return chunks;
  }

  /**
   * Smart text splitting that respects natural boundaries
   */
  private smartSplit(text: string): string[] {
    const segments: string[] = [];

    if (!this.config.preserveStructure) {
      // Simple character-based splitting
      for (let i = 0; i < text.length; i += this.config.maxChunkSize) {
        segments.push(text.slice(i, i + this.config.maxChunkSize));
      }
      return segments;
    }

    // Try to split at natural boundaries
    const paragraphs = text.split(/\n\s*\n/);
    let currentSegment = '';

    for (const paragraph of paragraphs) {
      const potentialSegment = currentSegment + (currentSegment ? '\n\n' : '') + paragraph;

      if (potentialSegment.length <= this.config.maxChunkSize) {
        currentSegment = potentialSegment;
      } else {
        // Current segment is full, start new one
        if (currentSegment.length >= this.config.minChunkSize) {
          segments.push(currentSegment);
          currentSegment = paragraph;
        } else {
          // Current segment too small, force split the paragraph
          const splitParagraph = this.forceSplit(potentialSegment);
          segments.push(...splitParagraph);
          currentSegment = '';
        }
      }
    }

    // Add remaining content
    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    return segments.filter(segment => segment.trim().length > 0);
  }

  /**
   * Force split text when it exceeds chunk size
   */
  private forceSplit(text: string): string[] {
    const segments: string[] = [];
    const sentences = text.split(/[.!?]+\s+/);
    let currentSegment = '';

    for (const sentence of sentences) {
      const potentialSegment = currentSegment + (currentSegment ? '. ' : '') + sentence;

      if (potentialSegment.length <= this.config.maxChunkSize) {
        currentSegment = potentialSegment;
      } else {
        if (currentSegment) {
          segments.push(currentSegment + '.');
        }
        // If single sentence is too long, split by characters
        if (sentence.length > this.config.maxChunkSize) {
          for (let i = 0; i < sentence.length; i += this.config.maxChunkSize) {
            segments.push(sentence.slice(i, i + this.config.maxChunkSize));
          }
          currentSegment = '';
        } else {
          currentSegment = sentence;
        }
      }
    }

    if (currentSegment) {
      segments.push(currentSegment + '.');
    }

    return segments.filter(segment => segment.trim().length > 0);
  }

  /**
   * Group keywords by semantic relatedness (simple heuristic)
   */
  private groupKeywordsByRelatedness(keywords: string[]): string[][] {
    const groups: string[][] = [];
    const maxGroupSize = 15; // Max keywords per group

    // Simple grouping by first letter and length for now
    // TODO: Could be enhanced with semantic similarity in the future
    const sorted = [...keywords].sort();

    for (let i = 0; i < sorted.length; i += maxGroupSize) {
      groups.push(sorted.slice(i, i + maxGroupSize));
    }

    return groups;
  }

  /**
   * Estimate number of concepts in text based on heuristics
   */
  private estimateConceptsInText(text: string): number {
    // Heuristic: estimate based on text length, complexity, and content type
    const wordCount = text.split(/\s+/).length;
    const uniqueWords = new Set(text.toLowerCase().split(/\s+/)).size;
    const complexityFactor = uniqueWords / wordCount; // Vocabulary diversity

    // Base estimate: ~1 concept per 50-100 words, adjusted for complexity
    const baseConcepts = Math.ceil(wordCount / 75);
    const complexityAdjustment = complexityFactor * 2; // More diverse vocabulary = more concepts

    return Math.max(1, Math.floor(baseConcepts * (1 + complexityAdjustment)));
  }

  /**
   * Calculate keyword importance weight
   */
  private calculateKeywordWeight(keywords?: string[]): number {
    if (!keywords || keywords.length === 0) return 0;

    // Weight based on number and average length of keywords
    const avgLength = keywords.reduce((sum, kw) => sum + kw.length, 0) / keywords.length;
    return Math.min(1, (keywords.length * avgLength) / 100);
  }

  /**
   * Calculate text complexity score
   */
  private calculateTextComplexity(text?: string): number {
    if (!text || text.length === 0) return 0;

    const words = text.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const vocabularyDiversity = uniqueWords / words.length;

    // Normalize to 0-1 scale
    return Math.min(1, (avgWordLength * vocabularyDiversity) / 10);
  }

  /**
   * Estimate total processing time for chunks
   */
  private estimateProcessingTime(chunks: ContentChunk[], totalConcepts: number): number {
    // Base time estimates (in seconds)
    const baseTimePerChunk = 15; // Base processing time per chunk
    const timePerConcept = 3;    // Additional time per estimated concept
    const similarityTimePerConcept = 5; // Time for similarity checking per concept

    const extractionTime = chunks.length * baseTimePerChunk + totalConcepts * timePerConcept;
    const similarityTime = totalConcepts * similarityTimePerConcept;
    const overhead = 10; // Buffer for analysis and finalization

    return extractionTime + similarityTime + overhead;
  }

  /**
   * Validate chunk configuration
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.maxChunkSize <= this.config.minChunkSize) {
      errors.push("maxChunkSize must be greater than minChunkSize");
    }

    if (this.config.overlapSize >= this.config.minChunkSize / 2) {
      errors.push("overlapSize should be less than half of minChunkSize");
    }

    if (this.config.targetConceptsPerChunk <= 0) {
      errors.push("targetConceptsPerChunk must be positive");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Factory function for creating content chunker with default config
 */
export function createContentChunker(config?: Partial<ChunkingConfig>): ContentChunker {
  return new ContentChunker(config);
}