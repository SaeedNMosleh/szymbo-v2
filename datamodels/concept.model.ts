import { Schema, model, models } from "mongoose";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

/**
 * Interface representing a learning concept
 * @interface IConcept
 */
export interface IConcept {
  id: string;
  name: string;
  category: ConceptCategory;
  description: string;
  examples: string[];
  prerequisites: string[];
  relatedConcepts: string[];
  difficulty: QuestionLevel;
  isActive: boolean;
  confidence: number; // 0-1 extraction confidence
  createdFrom: string[]; // source course IDs
  lastUpdated: Date;
}

const ConceptSchema = new Schema<IConcept>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: Object.values(ConceptCategory),
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    examples: { type: [String], default: [] },
    prerequisites: { type: [String], default: [] },
    relatedConcepts: { type: [String], default: [] },
    difficulty: {
      type: String,
      enum: Object.values(QuestionLevel),
      required: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0,
    },
    createdFrom: { type: [String], default: [] },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance
ConceptSchema.index({ name: 1, category: 1 }, { unique: true });
ConceptSchema.index({ difficulty: 1, isActive: 1 });
ConceptSchema.index({ createdFrom: 1 });

const Concept = models?.Concept || model<IConcept>("Concept", ConceptSchema);

export default Concept;