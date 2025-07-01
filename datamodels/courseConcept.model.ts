import { Schema, model, models } from "mongoose";

/**
 * Interface representing a mapping between a course and a concept
 * @interface ICourseConcept
 */
export interface ICourseConcept {
  courseId: number;
  conceptId: string;
  extractedDate: Date;
  confidence: number; // 0-1 extraction confidence
  isActive: boolean;
  sourceContent: string; // where in course this was found
}

const CourseConceptSchema = new Schema<ICourseConcept>(
  {
    courseId: {
      type: Number,
      required: true,
      ref: "Course",
    },
    conceptId: {
      type: String,
      required: true,
      ref: "Concept",
    },
    extractedDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sourceContent: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for uniqueness
CourseConceptSchema.index({ courseId: 1, conceptId: 1 }, { unique: true });

// Create index for reverse lookups
CourseConceptSchema.index({ conceptId: 1 });
CourseConceptSchema.index({ isActive: 1 });

const CourseConcept =
  models?.CourseConcept ||
  model<ICourseConcept>("CourseConcept", CourseConceptSchema);

export default CourseConcept;
