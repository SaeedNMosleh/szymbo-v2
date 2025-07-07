import { Schema, model, models } from "mongoose";
import { PracticeMode } from "@/lib/enum";

/**
 * Interface representing a concept-based practice session
 * @interface IConceptPracticeSession
 */
export interface IConceptPracticeSession {
  sessionId: string;
  userId: string; // for future multi-user support
  mode: PracticeMode;
  selectedConcepts: string[]; // concept IDs chosen for this session
  questionsUsed: string[]; // question bank IDs used in session
  startedAt: Date;
  completedAt: Date;
  sessionMetrics: {
    totalQuestions: number;
    correctAnswers: number;
    averageResponseTime: number;
    conceptsReviewed: number;
    newQuestionsGenerated: number;
    bankQuestionsUsed: number;
  };
  isActive: boolean;
}

const ConceptPracticeSessionSchema = new Schema<IConceptPracticeSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      default: "default", // single user for now
    },
    mode: {
      type: String,
      enum: Object.values(PracticeMode),
      required: true,
    },
    selectedConcepts: {
      type: [String],
      required: true,
      ref: "Concept",
    },
    questionsUsed: {
      type: [String],
      ref: "QuestionBank",
    },
    startedAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
    },
    sessionMetrics: {
      totalQuestions: {
        type: Number,
        default: 0,
      },
      correctAnswers: {
        type: Number,
        default: 0,
      },
      averageResponseTime: {
        type: Number,
        default: 0,
      },
      conceptsReviewed: {
        type: Number,
        default: 0,
      },
      newQuestionsGenerated: {
        type: Number,
        default: 0,
      },
      bankQuestionsUsed: {
        type: Number,
        default: 0,
      },
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

// Create indexes for performance
ConceptPracticeSessionSchema.index({ userId: 1, startedAt: -1 });
ConceptPracticeSessionSchema.index({ mode: 1 });
ConceptPracticeSessionSchema.index({ selectedConcepts: 1 });
ConceptPracticeSessionSchema.index({ isActive: 1 });

const ConceptPracticeSession =
  models?.ConceptPracticeSession ||
  model<IConceptPracticeSession>(
    "ConceptPracticeSession",
    ConceptPracticeSessionSchema
  );

export default ConceptPracticeSession;