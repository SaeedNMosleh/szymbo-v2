import { ConceptCategory, QuestionLevel } from "@/lib/enum";

/**
 * Represents a concept extracted from course content
 */
export interface ExtractedConcept {
  name: string;
  category: ConceptCategory;
  description: string;
  examples: string[];
  sourceContent: string; // where in course this was found
  confidence: number; // 0-1 LLM confidence
  suggestedDifficulty: QuestionLevel;
  suggestedTags: Array<{
    tag: string;
    source: 'existing' | 'new';
    confidence: number;
  }>;
}

/**
 * Represents a match between an extracted concept and an existing concept for merge potential
 */
export interface SimilarityMatch {
  conceptId: string;
  name: string;
  similarity: number; // 0-1 score
  category: ConceptCategory;
  description: string;
  examples: string[];
  mergeScore: number; // 0-1 score indicating merge potential
  mergeSuggestion?: {
    reason: string;
    conflictingFields: string[];
    suggestedMergedDescription?: string;
  };
}

/**
 * Comprehensive data structure for human review of extracted concepts
 */
export interface ConceptReviewData {
  courseId: number;
  courseName: string;
  extractedConcepts: ExtractedConcept[];
  similarityMatches: Map<string, SimilarityMatch[]>; // keyed by extracted concept name
  totalExtracted: number;
  highConfidenceCount: number;
}

/**
 * Result of the extraction process
 */
export interface ExtractionResult {
  success: boolean;
  data?: ConceptReviewData;
  error?: string;
  extractionId?: string; // for tracking async operations
}

/**
 * Review decision for human-in-the-loop concept approval
 */
export interface ReviewDecision {
  action: "approve" | "edit" | "reject" | "link";
  extractedConcept: ExtractedConcept;
  editedConcept?: Partial<ExtractedConcept>; // for edit action
  targetConceptId?: string; // for link action
  courseId: number;
}

/**
 * Batch review request
 */
export interface BatchReviewRequest {
  decisions: ReviewDecision[];
}

/**
 * Review processing result
 */
export interface ReviewResult {
  success: boolean;
  conceptName: string;
  action: string;
  conceptId?: string;
  error?: string;
}

/**
 * Custom error types for concept extraction
 */
export class ConceptExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConceptExtractionError";
  }
}

export class ConceptValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConceptValidationError";
  }
}

