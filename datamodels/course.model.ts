import { Schema, model, models } from "mongoose";
import { CourseType } from "@/lib/enum";

/**
 * Clean Course interface - Content input only
 * @interface ICourse
 */
export interface ICourse {
  // === CORE IDENTIFICATION ===
  courseId: number; // Unique identifier (required)
  date: Date; // Course date (required)

  // === COURSE CONTENT (Required) ===
  courseType: CourseType; // "new" | "review" | "mixed"
  keywords: string[]; // Key terms covered
  notes: string; // Main course content
  practice: string; // Practice exercises
  newWords: string[]; // New vocabulary introduced

  // === OPTIONAL COURSE METADATA ===
  mainSubjects?: string[]; // Main topics covered
  newSubjects?: string[]; // New topics introduced
  reviewSubjects?: string[]; // Topics reviewed
  weaknesses?: string[]; // Areas of difficulty noted
  strengths?: string[]; // Areas of strength noted
  homework?: string; // Assigned homework content

  // === CONCEPT EXTRACTION STATUS ===
  conceptExtractionStatus?: "pending" | "extracting" | "reviewing" | "completed" | "error";
}

const CourseSchema = new Schema<ICourse>(
  {
    // Core identification (required)
    courseId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true, // For date-based queries
    },

    // Course content (required)
    courseType: {
      type: String,
      enum: Object.values(CourseType), // "new", "review", "mixed"
      required: true,
      index: true, // For filtering by type
    },
    keywords: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "At least one keyword is required",
      },
    },
    notes: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, "Notes must be at least 10 characters"],
    },
    practice: {
      type: String,
      required: true,
      trim: true,
      minlength: [5, "Practice must be at least 5 characters"],
    },
    newWords: {
      type: [String],
      required: true,
      default: [],
    },

    // Optional metadata
    mainSubjects: {
      type: [String],
      required: false,
      default: [],
    },
    newSubjects: {
      type: [String],
      required: false,
      default: [],
    },
    reviewSubjects: {
      type: [String],
      required: false,
      default: [],
    },
    weaknesses: {
      type: [String],
      required: false,
      default: [],
    },
    strengths: {
      type: [String],
      required: false,
      default: [],
    },
    homework: {
      type: String,
      required: false,
      trim: true,
    },
    conceptExtractionStatus: {
      type: String,
      enum: ["pending", "extracting", "reviewing", "completed", "error"],
      default: "pending",
      required: false,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt
    collection: "courses", // Explicit collection name
  }
);

// === INDEXES FOR PERFORMANCE ===
CourseSchema.index({ courseType: 1, date: -1 }); // Compound index for type + date queries
CourseSchema.index({ keywords: 1 }); // Text searches on keywords
CourseSchema.index({ createdAt: -1 }); // Recent courses first

// === INSTANCE METHODS ===
CourseSchema.methods.getKeywordString = function (): string {
  return this.keywords.join(", ");
};

CourseSchema.methods.getAllSubjects = function (): string[] {
  return [
    ...(this.mainSubjects || []),
    ...(this.newSubjects || []),
    ...(this.reviewSubjects || []),
  ];
};

// === STATIC METHODS ===
CourseSchema.statics.findByKeyword = function (keyword: string) {
  return this.find({ keywords: { $in: [keyword] } });
};

CourseSchema.statics.findByDateRange = function (
  startDate: Date,
  endDate: Date
) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: -1 });
};

const Course = models?.Course || model<ICourse>("Course", CourseSchema);

export default Course;
