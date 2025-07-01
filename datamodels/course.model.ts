import { Schema, model, models } from "mongoose";
import { CourseType, ConceptExtractionStatus } from "@/lib/enum";

export interface ICourse {
  courseId: number;
  date: Date;
  keywords: string[];
  mainSubjects?: string[];
  courseType: CourseType;
  newSubjects?: string[];
  reviewSubjects?: string[];
  weaknesses?: string[];
  strengths?: string[];
  notes: string;
  practice: string;
  homework?: string;
  nextPracticeDate?: Date;
  newWords: string[];
  practiceIds?: string[];
  numberOfPractices?: number;
  fluency?: number;
  easinessFactor?: number;
  extractedConcepts?: string[]; // concept IDs
  conceptExtractionDate?: Date;
  conceptExtractionStatus?: ConceptExtractionStatus;
}

const CourseSchema = new Schema<ICourse>(
  {
    courseId: { type: Number, required: true, unique: true },
    date: { type: Date, required: true },
    keywords: { type: [String], required: true },
    mainSubjects: { type: [String], required: false },
    courseType: {
      type: String,
      enum: Object.values(CourseType),
      required: true,
    },
    newSubjects: { type: [String], required: false },
    reviewSubjects: { type: [String], required: false },
    weaknesses: { type: [String], required: false },
    strengths: { type: [String], required: false },
    notes: { type: String, required: true },
    practice: { type: String, required: true },
    homework: { type: String, required: false },
    newWords: { type: [String], required: true },
    practiceIds: { type: [String], default: [] },
    numberOfPractices: { type: Number, default: 0 },
    fluency: { type: Number, min: 0, max: 10, default: 0 },
    nextPracticeDate: { type: Date, default: null },
    easinessFactor: { type: Number, default: 2.5, min: 1.3, max: 2.5 },
    extractedConcepts: { type: [String], default: [], ref: "Concept" },
    conceptExtractionDate: { type: Date, default: null },
    conceptExtractionStatus: {
      type: String,
      enum: Object.values(ConceptExtractionStatus),
      default: ConceptExtractionStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for concept extraction status filtering
CourseSchema.index({ conceptExtractionStatus: 1 });

const Course = models?.Course || model<ICourse>("Course", CourseSchema);

export default Course;
