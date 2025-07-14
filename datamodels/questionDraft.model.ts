import { Schema, model, models } from "mongoose";
import { QuestionType, QuestionLevel } from "@/lib/enum";

/**
 * Interface representing a draft question in the staging area
 * @interface IQuestionDraft
 */
export interface IQuestionDraft {
  id: string;
  question: string;
  correctAnswer: string;
  questionType: QuestionType;
  targetConcepts: string[]; // concept IDs - all internal storage uses concept IDs
  difficulty: QuestionLevel;
  source: "generated" | "manual";
  createdDate: Date;
  
  // Optional fields for different question types
  options?: string[]; // Multiple choice options OR word bank for arrangement
  audioUrl?: string; // Audio file URL
  imageUrl?: string; // Image file URL
}

const QuestionDraftSchema = new Schema<IQuestionDraft>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    question: {
      type: String,
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    questionType: {
      type: String,
      enum: Object.values(QuestionType),
      required: true,
    },
    targetConcepts: {
      type: [String],
      required: true,
    },
    difficulty: {
      type: String,
      enum: Object.values(QuestionLevel),
      required: true,
    },
    source: {
      type: String,
      enum: ["generated", "manual"],
      required: true,
    },
    createdDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    options: {
      type: [String],
      required: false,
    },
    audioUrl: {
      type: String,
      required: false,
    },
    imageUrl: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance
QuestionDraftSchema.index({ createdDate: 1 });
QuestionDraftSchema.index({ questionType: 1 });
QuestionDraftSchema.index({ source: 1 });

const QuestionDraft =
  models?.QuestionDraft ||
  model<IQuestionDraft>("QuestionDraft", QuestionDraftSchema);

export default QuestionDraft;