import { Schema, model, models } from "mongoose";
import type { IQuestionAnswer } from "./questionAnswer.model";

export interface INewWords {
  attempted: number;
  correct: number;
  weakItems: string[];
}

export interface IVocabulary {
  newWords: INewWords;
}

export interface IConcept {
  name: string;
  attempts: number;
  correct: number;
}

export interface IGrammar {
  concepts: IConcept[];
}

export interface IMetrics {
  vocabulary: IVocabulary;
  grammar: IGrammar;
  accuracy: number;
  avgResponseTime: number;
}

export interface IPracticeSession {
  courseId: number;
  startedAt: Date;
  completedAt: Date;
  questionAnswers: IQuestionAnswer[];
  metrics: IMetrics;
  
  // NEW: Concept integration for backwards compatibility
  conceptIds?: string[]; // concepts practiced in this session
}

const PracticeSessionSchema = new Schema<IPracticeSession>(
  {
    courseId: { type: Number, required: true, ref: "Course" },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
    questionAnswers: [{ type: Schema.Types.ObjectId, ref: "QuestionAnswer" }],
    metrics: {
      vocabulary: {
        newWords: {
          attempted: Number,
          correct: Number,
          weakItems: [String],
        },
      },
      grammar: {
        concepts: [
          {
            name: String,
            attempts: Number,
            correct: Number,
          },
        ],
      },
      accuracy: Number,
      avgResponseTime: Number,
    },
    
    // NEW: Concept integration
    conceptIds: { type: [String], default: [], ref: "Concept" },
  },
  {
    timestamps: true,
  }
);

const PracticeSession =
  models?.PracticeSession ||
  model<IPracticeSession>("PracticeSession", PracticeSessionSchema);

export default PracticeSession;