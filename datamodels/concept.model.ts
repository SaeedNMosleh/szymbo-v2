import { Schema, model, models } from "mongoose";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

/**
 * Vocabulary-specific data for enriched language learning
 * @interface IVocabularyData
 */
export interface IVocabularyData {
  word: string;           // Primary word: "nóż"
  translation: string;    // English translation: "knife"
  partOfSpeech: string;   // "noun", "verb", "adjective"
  gender?: string;        // "masculine", "feminine", "neuter" (for nouns)
  pluralForm?: string;    // Plural form if applicable    
  pronunciation?: string; // IPA or phonetic guide
}

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
  
  // Enhanced fields for concept management hub
  tags: string[];
  sourceType: 'course' | 'document' | 'manual' | 'import';
  version: number; // for concept evolution tracking
  parentConceptId?: string; // for split concepts
  mergedFromIds?: string[]; // for merged concepts
  isArchived?: boolean; // soft delete marker
  archivedDate?: Date;
  vocabularyData?: IVocabularyData; // vocabulary-specific data
}

const VocabularyDataSchema = new Schema<IVocabularyData>({
  word: { type: String, required: true },
  translation: { type: String, required: true },
  partOfSpeech: { type: String, required: true },
  gender: { type: String },
  pluralForm: { type: String },
  pronunciation: { type: String },
}, { _id: false });

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
    
    // Enhanced fields for concept management hub
    tags: { type: [String], default: [], index: true },
    sourceType: { 
      type: String, 
      enum: ['course', 'document', 'manual', 'import'],
      default: 'course',
      index: true 
    },
    version: { type: Number, default: 1 },
    parentConceptId: { type: String, index: true },
    mergedFromIds: { type: [String], default: [] },
    isArchived: { type: Boolean, default: false, index: true },
    archivedDate: { type: Date },
    vocabularyData: { type: VocabularyDataSchema },
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