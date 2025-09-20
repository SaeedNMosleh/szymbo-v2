import { Schema, model, models } from "mongoose";
import { z } from "zod";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

/**
 * Duplicate detection result for session
 */
export interface DuplicateDetectionResult {
  hasDuplicates: boolean;
  duplicates: Array<{
    extractedConceptName: string;
    existingConcept: {
      id: string;
      name: string;
      category: ConceptCategory;
    };
    duplicateType: "exact" | "case_insensitive";
  }>;
  checkedAt: Date;
}

/**
 * Suggested tag with metadata
 */
export interface SuggestedTag {
  tag: string;
  source: "existing" | "new";
  confidence: number;
}

/**
 * Extracted concept from LLM analysis
 */
export interface ExtractedConcept {
  name: string;
  category: ConceptCategory;
  description: string;
  examples: string[];
  sourceContent: string;
  confidence: number;
  suggestedDifficulty: QuestionLevel;
  suggestedTags: SuggestedTag[];
  vocabularyData?: {
    word: string;
    translation: string;
    partOfSpeech: string;
    gender?: string;
    pluralForm?: string;
    pronunciation?: string;
  };
  extractionMetadata?: {
    model: string;
    timestamp: Date;
    processingTime: number;
  };
}

/**
 * Enhanced review decision interface - removed 'link' action, focus on merge for similarity
 */
export interface ReviewDecision {
  action: "approve" | "edit" | "reject" | "merge" | "manual_add";
  extractedConcept: ExtractedConcept;
  editedConcept?: Partial<ExtractedConcept>; // for edit action
  mergeData?: {
    primaryConceptId: string;
    additionalData: {
      description?: string;
      examples?: string[];
      tags?: string[];
    };
  };
  courseId: number;
  reviewedAt: Date;
  reviewerId?: string; // for future multi-user support
}

/**
 * Similarity match focused on merge potential
 */
export interface SimilarityMatch {
  conceptId: string;
  name: string;
  similarity: number;
  category: ConceptCategory;
  description: string;
  examples: string[];
  mergeScore: number; // Score indicating merge potential (0-1)
  mergeSuggestion?: {
    reason: string;
    conflictingFields: string[];
    suggestedMergedDescription?: string;
  };
}

export interface SimilarityData {
  extractedConceptName: string;
  matches: SimilarityMatch[];
}

/**
 * Simplified extraction progress tracking
 */
export interface ExtractionProgress {
  currentOperation?: string;
  errorMessage?: string;
  lastUpdated: Date;
}

/**
 * Review progress tracking
 */
export interface ReviewProgress {
  totalConcepts: number;
  reviewedCount: number;
  decisions: ReviewDecision[];
  lastReviewedAt?: Date;
  isDraft: boolean;
}

/**
 * Main interface for concept extraction session
 */
export interface IConceptExtractionSession {
  id: string;
  courseId: number;
  courseName: string;
  extractionDate: Date;
  status: "extracting" | "reviewing" | "extracted" | "completed" | "error";
  extractedConcepts: ExtractedConcept[];
  similarityMatches: SimilarityData[];
  reviewProgress: ReviewProgress;
  extractionProgress?: ExtractionProgress; // Simple progress tracking
  duplicateDetection?: DuplicateDetectionResult; // Optional for backward compatibility
  newTagsCreated: string[]; // Session-level tracking of newly created tags
  extractionMetadata: {
    llmModel: string;
    totalProcessingTime: number;
    extractionConfidence: number;
    sourceContentLength: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Zod validation schemas
export const SuggestedTagSchema = z.object({
  tag: z.string().min(1, "Tag cannot be empty"),
  source: z.enum(["existing", "new"]),
  confidence: z.number().min(0).max(1),
});

export const ExtractionProgressSchema = z.object({
  currentOperation: z.string().optional(),
  errorMessage: z.string().optional(),
  lastUpdated: z.date(),
});

export const ExtractedConceptSchema = z.object({
  name: z.string().min(1, "Concept name is required"),
  category: z.nativeEnum(ConceptCategory),
  description: z.string().min(10, "Description must be at least 10 characters"),
  examples: z.array(z.string()).min(1, "At least one example is required"),
  sourceContent: z.string().min(1, "Source content is required"),
  confidence: z.number().min(0).max(1),
  suggestedDifficulty: z.nativeEnum(QuestionLevel),
  suggestedTags: z.array(SuggestedTagSchema),
  vocabularyData: z
    .object({
      word: z.string(),
      translation: z.string(),
      partOfSpeech: z.string(),
      gender: z.string().optional(),
      pluralForm: z.string().optional(),
      pronunciation: z.string().optional(),
    })
    .optional(),
  extractionMetadata: z
    .object({
      model: z.string(),
      timestamp: z
        .string()
        .datetime()
        .transform((date) => new Date(date)),
      processingTime: z.number(),
    })
    .optional(),
});

export const SimilarityMatchSchema = z.object({
  conceptId: z.string().min(1),
  name: z.string().min(1),
  similarity: z.number().min(0).max(1),
  category: z.nativeEnum(ConceptCategory),
  description: z.string().min(1),
  examples: z.array(z.string()),
  mergeScore: z.number().min(0).max(1),
  mergeSuggestion: z
    .object({
      reason: z.string(),
      conflictingFields: z.array(z.string()),
      suggestedMergedDescription: z.string().optional(),
    })
    .optional(),
});

export const SimilarityDataSchema = z.object({
  extractedConceptName: z.string().min(1),
  matches: z.array(SimilarityMatchSchema),
});

export const ReviewDecisionSchema = z.object({
  action: z.enum(["approve", "edit", "reject", "merge", "manual_add"]),
  extractedConcept: ExtractedConceptSchema,
  editedConcept: ExtractedConceptSchema.partial().optional(),
  mergeData: z
    .object({
      primaryConceptId: z.string(),
      additionalData: z.object({
        description: z.string().optional(),
        examples: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
      }),
    })
    .optional(),
  courseId: z.number(),
  reviewedAt: z
    .string()
    .datetime()
    .transform((date) => new Date(date)),
  reviewerId: z.string().optional(),
});

export const ReviewProgressSchema = z.object({
  totalConcepts: z.number().min(0),
  reviewedCount: z.number().min(0),
  decisions: z.array(ReviewDecisionSchema),
  lastReviewedAt: z
    .string()
    .datetime()
    .transform((date) => new Date(date))
    .optional(),
  isDraft: z.boolean(),
});

export const DuplicateDetectionResultSchema = z.object({
  hasDuplicates: z.boolean(),
  duplicates: z.array(
    z.object({
      extractedConceptName: z.string(),
      existingConcept: z.object({
        id: z.string(),
        name: z.string(),
        category: z.nativeEnum(ConceptCategory),
      }),
      duplicateType: z.enum(["exact", "case_insensitive"]),
    })
  ),
  checkedAt: z.date(),
});

export const ConceptExtractionSessionSchema = z.object({
  id: z.string().min(1),
  courseId: z.number(),
  courseName: z.string().min(1),
  extractionDate: z.date(),
  status: z.enum(["extracting", "reviewing", "completed", "error"]),
  extractedConcepts: z.array(ExtractedConceptSchema),
  similarityMatches: z.array(SimilarityDataSchema),
  reviewProgress: ReviewProgressSchema,
  extractionProgress: ExtractionProgressSchema.optional(),
  duplicateDetection: DuplicateDetectionResultSchema.optional(),
  newTagsCreated: z.array(z.string()),
  extractionMetadata: z.object({
    llmModel: z.string(),
    totalProcessingTime: z.number(),
    extractionConfidence: z.number().min(0).max(1),
    sourceContentLength: z.number(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Mongoose Schema
const ConceptExtractionSessionMongooseSchema =
  new Schema<IConceptExtractionSession>(
    {
      id: { type: String, required: true, unique: true },
      courseId: { type: Number, required: true, index: true },
      courseName: { type: String, required: true },
      extractionDate: { type: Date, required: true },
      status: {
        type: String,
        enum: ["extracting", "reviewing", "completed", "error"],
        required: true,
        default: "extracting",
        index: true,
      },
      extractedConcepts: [
        {
          name: { type: String, required: true },
          category: {
            type: String,
            enum: Object.values(ConceptCategory),
            required: true,
          },
          description: { type: String, required: true },
          examples: { type: [String], required: true },
          sourceContent: { type: String, required: true },
          confidence: { type: Number, required: true, min: 0, max: 1 },
          suggestedDifficulty: {
            type: String,
            enum: Object.values(QuestionLevel),
            required: true,
          },
          suggestedTags: [
            {
              tag: { type: String, required: true },
              source: {
                type: String,
                enum: ["existing", "new"],
                required: true,
              },
              confidence: { type: Number, required: true, min: 0, max: 1 },
            },
          ],
          extractionMetadata: {
            model: { type: String },
            timestamp: { type: Date },
            processingTime: { type: Number },
          },
        },
      ],
      similarityMatches: [
        {
          extractedConceptName: { type: String, required: true },
          matches: [
            {
              conceptId: { type: String, required: true },
              name: { type: String, required: true },
              similarity: { type: Number, required: true, min: 0, max: 1 },
              category: {
                type: String,
                enum: Object.values(ConceptCategory),
                required: true,
              },
              description: { type: String, required: true },
              examples: { type: [String], required: true },
              mergeScore: { type: Number, required: true, min: 0, max: 1 },
              mergeSuggestion: {
                reason: { type: String },
                conflictingFields: { type: [String] },
                suggestedMergedDescription: { type: String },
              },
            },
          ],
        },
      ],
      reviewProgress: {
        totalConcepts: { type: Number, required: true, min: 0 },
        reviewedCount: { type: Number, required: true, min: 0, default: 0 },
        decisions: [
          {
            action: {
              type: String,
              enum: ["approve", "edit", "reject", "merge", "manual_add"],
              required: true,
            },
            extractedConcept: {
              name: { type: String, required: true },
              category: {
                type: String,
                enum: Object.values(ConceptCategory),
                required: true,
              },
              description: { type: String, required: true },
              examples: { type: [String], required: true },
              sourceContent: { type: String, required: true },
              confidence: { type: Number, required: true },
              suggestedDifficulty: {
                type: String,
                enum: Object.values(QuestionLevel),
                required: true,
              },
              suggestedTags: [
                {
                  tag: { type: String, required: true },
                  source: {
                    type: String,
                    enum: ["existing", "new"],
                    required: true,
                  },
                  confidence: { type: Number, required: true, min: 0, max: 1 },
                },
              ],
            },
            editedConcept: { type: Schema.Types.Mixed },
            mergeData: {
              primaryConceptId: { type: String },
              additionalData: { type: Schema.Types.Mixed },
            },
            courseId: { type: Number, required: true },
            reviewedAt: { type: Date, required: true },
            reviewerId: { type: String },
          },
        ],
        lastReviewedAt: { type: Date },
        isDraft: { type: Boolean, default: true },
      },
      extractionProgress: {
        currentOperation: { type: String },
        errorMessage: { type: String },
        lastUpdated: { type: Date, required: true },
      },
      duplicateDetection: {
        hasDuplicates: { type: Boolean },
        duplicates: [
          {
            extractedConceptName: { type: String },
            existingConcept: {
              id: { type: String },
              name: { type: String },
              category: {
                type: String,
                enum: Object.values(ConceptCategory),
              },
            },
            duplicateType: {
              type: String,
              enum: ["exact", "case_insensitive"],
            },
          },
        ],
        checkedAt: { type: Date },
      },
      newTagsCreated: { type: [String], default: [] },
      extractionMetadata: {
        llmModel: { type: String, required: true },
        totalProcessingTime: { type: Number, required: true },
        extractionConfidence: { type: Number, required: true, min: 0, max: 1 },
        sourceContentLength: { type: Number, required: true },
      },
    },
    {
      timestamps: true,
    }
  );

// Create indexes for performance
ConceptExtractionSessionMongooseSchema.index({ courseId: 1, status: 1 });
ConceptExtractionSessionMongooseSchema.index({ extractionDate: -1 });
ConceptExtractionSessionMongooseSchema.index({
  status: 1,
  "reviewProgress.isDraft": 1,
});

const ConceptExtractionSession =
  models?.ConceptExtractionSession ||
  model<IConceptExtractionSession>(
    "ConceptExtractionSession",
    ConceptExtractionSessionMongooseSchema
  );

export default ConceptExtractionSession;

// Helper functions for validation
export const validateExtractedConcept = (data: unknown) => {
  return ExtractedConceptSchema.safeParse(data);
};

export const validateReviewDecision = (data: unknown) => {
  return ReviewDecisionSchema.safeParse(data);
};

export const validateConceptExtractionSession = (data: unknown) => {
  return ConceptExtractionSessionSchema.safeParse(data);
};
