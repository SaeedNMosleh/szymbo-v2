import { Schema, model, models } from "mongoose";

/**
 * Types of relationships between concepts
 */
export type RelationshipType = 
  | 'prerequisite'   // A requires B to be learned first
  | 'related'        // A and B are conceptually related
  | 'similar'        // A and B are similar/synonymous
  | 'opposite'       // A and B are opposites/antonyms
  | 'parent-child'   // A is a broader category containing B
  | 'example-of'     // A is an example of concept B
  | 'progression';   // A naturally leads to learning B

/**
 * Source of relationship creation
 */
export type RelationshipSource = 'user' | 'llm' | 'system';

/**
 * Interface representing relationships between concepts
 * Enables sophisticated concept mapping and learning pathways
 * @interface IConceptRelationship
 */
export interface IConceptRelationship {
  id: string;
  fromConceptId: string;        // Source concept
  toConceptId: string;          // Target concept
  relationshipType: RelationshipType;
  strength: number;             // 0-1 relationship strength/confidence
  createdBy: RelationshipSource;
  
  // Optional metadata
  description?: string;         // Human-readable description of relationship
  evidence?: string[];          // Supporting evidence (sentences, examples)
  bidirectional: boolean;       // Whether relationship works both ways
  
  // Workflow fields
  isActive: boolean;
  isVerified: boolean;          // Human verification of LLM-created relationships
  verifiedBy?: string;          // User who verified the relationship
  verifiedDate?: Date;
  
  // Timestamps
  createdDate: Date;
  lastUpdated: Date;
}

const ConceptRelationshipSchema = new Schema<IConceptRelationship>(
  {
    id: { type: String, required: true, unique: true },
    fromConceptId: { 
      type: String, 
      required: true, 
      index: true,
      ref: "Concept" 
    },
    toConceptId: { 
      type: String, 
      required: true, 
      index: true,
      ref: "Concept" 
    },
    relationshipType: {
      type: String,
      enum: [
        'prerequisite',
        'related', 
        'similar',
        'opposite',
        'parent-child',
        'example-of',
        'progression'
      ],
      required: true,
      index: true,
    },
    strength: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0.5,
    },
    createdBy: {
      type: String,
      enum: ['user', 'llm', 'system'],
      required: true,
      index: true,
    },
    
    // Optional metadata
    description: { type: String },
    evidence: { type: [String], default: [] },
    bidirectional: { type: Boolean, default: false },
    
    // Workflow fields
    isActive: { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false, index: true },
    verifiedBy: { type: String },
    verifiedDate: { type: Date },
    
    // Timestamps
    createdDate: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for performance and uniqueness
ConceptRelationshipSchema.index(
  { fromConceptId: 1, toConceptId: 1, relationshipType: 1 }, 
  { unique: true }
);
ConceptRelationshipSchema.index({ fromConceptId: 1, isActive: 1 });
ConceptRelationshipSchema.index({ toConceptId: 1, isActive: 1 });
ConceptRelationshipSchema.index({ relationshipType: 1, isActive: 1 });
ConceptRelationshipSchema.index({ createdBy: 1, isVerified: 1 });
ConceptRelationshipSchema.index({ strength: 1, isActive: 1 });

// Prevent self-referencing relationships
ConceptRelationshipSchema.pre('save', function(next) {
  if (this.fromConceptId === this.toConceptId) {
    const error = new Error('Cannot create relationship from concept to itself');
    return next(error);
  }
  next();
});

const ConceptRelationship = models?.ConceptRelationship || 
  model<IConceptRelationship>("ConceptRelationship", ConceptRelationshipSchema);

export default ConceptRelationship;