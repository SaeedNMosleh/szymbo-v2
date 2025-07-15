import { Schema, model, models } from "mongoose";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

/**
 * Interface representing a hierarchical concept group
 * Based on the concept definition from Szymbo Concept definition.md
 * @interface IConceptGroup
 */
export interface IConceptGroup {
  id: string;
  name: string;           // "Kitchen", "Household", "Present Tense Verbs"
  description: string;
  
  // Simple hierarchical associations
  memberConcepts: string[];  // Direct concept IDs at this level
  parentGroup?: string;      // Parent group ID
  childGroups: string[];     // Child group IDs
  
  // Metadata
  groupType: "vocabulary" | "grammar" | "mixed";
  level: number;            // 1=leaf concepts, 2=mid-level, 3=top-level
  difficulty: QuestionLevel;
  isActive: boolean;
  createdDate: Date;
  lastUpdated: Date;
}

const ConceptGroupSchema = new Schema<IConceptGroup>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, index: true },
    description: { type: String, required: true },
    
    // Hierarchical structure
    memberConcepts: { type: [String], default: [], index: true },
    parentGroup: { type: String, index: true },
    childGroups: { type: [String], default: [] },
    
    // Metadata
    groupType: {
      type: String,
      enum: ["vocabulary", "grammar", "mixed"],
      required: true,
      index: true,
    },
    level: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5,
      index: true 
    },
    difficulty: {
      type: String,
      enum: Object.values(QuestionLevel),
      required: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    createdDate: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for performance
ConceptGroupSchema.index({ name: 1, groupType: 1 }, { unique: true });
ConceptGroupSchema.index({ level: 1, isActive: 1 });
ConceptGroupSchema.index({ parentGroup: 1, isActive: 1 });
ConceptGroupSchema.index({ groupType: 1, difficulty: 1 });

const ConceptGroup = models?.ConceptGroup || model<IConceptGroup>("ConceptGroup", ConceptGroupSchema);

export default ConceptGroup;