import { Schema, model, models } from "mongoose";

export interface ICourse {
  courseId: number;
  date: Date;
  keywords: string[];
  mainSubjects?: string[];
  courseType: string;
  newSubjects?: string[];
  reviewSubjects?: string[];
  weaknesses?: string[];
  strengths?: string[];
  notes: string;
  practice: string;
  homework?: string;
  nextPracticeDate?: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    courseId: { type: Number, required: true, unique: true },
    date: { type: Date, required: true },
    keywords: { type: [String], required: true },
    mainSubjects: { type: [String], required: false },
    courseType: {
      type: String,
      required: true,
      enum: ["new", "review", "mixed"],
    },
    newSubjects: { type: [String], required: false },
    reviewSubjects: { type: [String], required: false },
    weaknesses: { type: [String], required: false },
    strengths: { type: [String], required: false },
    notes: { type: String, required: true },
    practice: { type: String, required: true },
    homework: { type: String, required: false },
    nextPracticeDate: { type: Date, required: false },
  },
  {
    timestamps: true,
  }
);

const Course = models?.Course || model<ICourse>("Course", CourseSchema);

export default Course;
