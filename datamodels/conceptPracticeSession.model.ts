import { Schema, model, models } from "mongoose";
import { PracticeMode } from "@/lib/enum";

/**
 * Interface representing a question response with attempt tracking
 * @interface IQuestionResponse
 */
export interface IQuestionResponse {
  questionId: string;
  attempts: number; // Current attempt number (1-3)
  isCorrect: boolean;
  responseTime: number; // Total time across all attempts
  userAnswer: string; // Final answer provided
  timestamp: Date; // When the question was completed
}

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
  questionResponses: IQuestionResponse[]; // Detailed responses per question
  startedAt: Date;
  completedAt?: Date;
  completionReason: 'completed' | 'abandoned';
  sessionMetrics: {
    totalQuestions: number; // Questions attempted (not planned)
    correctAnswers: number;
    newQuestionsGenerated: number;
  };
  isActive: boolean;
}

const QuestionResponseSchema = new Schema<IQuestionResponse>(
  {
    questionId: {
      type: String,
      required: true,
      ref: "QuestionBank",
    },
    attempts: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    responseTime: {
      type: Number,
      required: true,
      min: 0,
    },
    userAnswer: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

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
    questionResponses: {
      type: [QuestionResponseSchema],
      default: [],
    },
    startedAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
    },
    completionReason: {
      type: String,
      enum: ['completed', 'abandoned'],
      default: 'completed',
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
      newQuestionsGenerated: {
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