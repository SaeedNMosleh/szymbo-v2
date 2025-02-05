import { Schema, model, models } from "mongoose";

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

export interface IInteraction {
  questionType: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  responseTime: number;
  confidenceLevel: number;
  errorType: string;
}

export interface IMetrics {
  vocabulary: IVocabulary;
  grammar: IGrammar;
  accuracy: number;
  avgResponseTime: number;
}

export interface ISrsSchedule {
  nextReviewDate: Date;
  easinessFactor: number;
}

export interface IPracticeSession {
  courseId: number;
  startedAt: Date;
  completedAt: Date;
  interactions: IInteraction[];
  metrics: IMetrics;
  srsSchedule: ISrsSchedule;
}

const PracticeSessionSchema = new Schema<IPracticeSession>({
  courseId: { type: Number, required: true, ref: "Course" },
  startedAt: { type: Date, required: true },
  completedAt: { type: Date },
  interactions: [
    {
      questionType: {
        type: String,
        enum: ["clozed gap", "multiple choice", "make sentence", "Q&A"],
      },
      question: String,
      userAnswer: String,
      correctAnswer: String,
      responseTime: Number,
      confidenceLevel: { type: Number, min: 0, max: 5 },
      errorType: {
        type: String,
        enum: ["typo", "grammar", "vocab", "word_order", "incomplete answer", null],
      },
    },
  ],
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
  srsSchedule: {
    nextReviewDate: Date,
    easinessFactor: { type: Number, default: 2.5 },
  },
});

const PracticeSession =
  models?.PracticeSession ||
  model<IPracticeSession>("PracticeSession", PracticeSessionSchema);

export default PracticeSession;
