import { Schema, model, models } from "mongoose";
import { QuestionType, QuestionLevel } from "@/lib/enum";

/**
 * Interface representing a question in the question bank
 * @interface IQuestionBank
 */
export interface IQuestionBank {
  id: string;
  question: string;
  correctAnswer: string;
  questionType: QuestionType;
  targetConcepts: string[]; // concept IDs this question tests
  difficulty: QuestionLevel;
  timesUsed: number;
  successRate: number; // 0-1 based on user responses
  lastUsed: Date;
  createdDate: Date;
  isActive: boolean;
  source: "generated" | "manual";
  
  // Optional fields for different question types
  options?: string[]; // Multiple choice options OR word bank for arrangement
  audioUrl?: string; // Audio file URL
  imageUrl?: string; // Image file URL
}

const QuestionBankSchema = new Schema<IQuestionBank>(
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
      ref: "Concept",
    },
    difficulty: {
      type: String,
      enum: Object.values(QuestionLevel),
      required: true,
    },
    timesUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    lastUsed: {
      type: Date,
      default: null,
    },
    createdDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      enum: ["generated", "manual"],
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
QuestionBankSchema.index({ targetConcepts: 1 });
QuestionBankSchema.index({ difficulty: 1, isActive: 1 });
QuestionBankSchema.index({ questionType: 1 });
QuestionBankSchema.index({ lastUsed: 1 });
QuestionBankSchema.index({ successRate: 1 });

const QuestionBank =
  models?.QuestionBank ||
  model<IQuestionBank>("QuestionBank", QuestionBankSchema);

export default QuestionBank;
