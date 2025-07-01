import { Schema, model, models } from "mongoose";

/**
 * Interface representing a user's progress on a concept
 * @interface IConceptProgress
 */
export interface IConceptProgress {
  userId: string; // for future multi-user support
  conceptId: string;
  masteryLevel: number; // 0-1 scale
  lastPracticed: Date;
  nextReview: Date; // SRS calculation
  successRate: number; // 0-1 based on performance
  totalAttempts: number;
  consecutiveCorrect: number;
  easinessFactor: number; // SRS parameter (1.3-2.5)
  intervalDays: number; // SRS parameter
  isActive: boolean;
}

const ConceptProgressSchema = new Schema<IConceptProgress>(
  {
    userId: {
      type: String,
      required: true,
    },
    conceptId: {
      type: String,
      required: true,
      ref: "Concept",
    },
    masteryLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0,
    },
    lastPracticed: {
      type: Date,
      default: null,
    },
    nextReview: {
      type: Date,
      default: Date.now,
      index: true,
    },
    successRate: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    totalAttempts: {
      type: Number,
      min: 0,
      default: 0,
    },
    consecutiveCorrect: {
      type: Number,
      min: 0,
      default: 0,
    },
    easinessFactor: {
      type: Number,
      min: 1.3,
      max: 2.5,
      default: 2.5,
    },
    intervalDays: {
      type: Number,
      min: 0,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound unique index on userId + conceptId
ConceptProgressSchema.index({ userId: 1, conceptId: 1 }, { unique: true });

// Index for due date queries
ConceptProgressSchema.index({ nextReview: 1, isActive: 1 });
ConceptProgressSchema.index({ masteryLevel: 1 });
ConceptProgressSchema.index({ conceptId: 1 });

const ConceptProgress =
  models?.ConceptProgress ||
  model<IConceptProgress>("ConceptProgress", ConceptProgressSchema);

export default ConceptProgress;
