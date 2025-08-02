import { Schema, model, models, Document } from "mongoose";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

/**
 * Allowed parts of speech for vocabulary validation
 */
const ALLOWED_PARTS_OF_SPEECH = [
  "noun", "verb", "adjective", "adverb", "preposition", 
  "conjunction", "interjection", "pronoun", "numeral", "particle"
];

/**
 * Vocabulary-specific data for enriched language learning
 * @interface IVocabularyData
 */
export interface IVocabularyData {
  word: string; // Primary word: "nóż"
  translation: string; // English translation: "knife"
  partOfSpeech: string; // "noun", "verb", "adjective"
  gender?: string; // "masculine", "feminine", "neuter" (for nouns)
  pluralForm?: string; // Plural form if applicable
  pronunciation?: string; // IPA or phonetic guide
}

/**
 * Interface representing a learning concept
 * @interface IConcept
 */
export interface IConcept extends Document {
  id: string;
  name: string;
  category: ConceptCategory;
  description: string;
  examples: string[];
  difficulty: QuestionLevel;
  tags: string[];
  sourceType: "course" | "document" | "manual" | "import";
  isActive: boolean;
  confidence: number; // 0-1 extraction confidence
  createdFrom: string[]; // source course IDs
  vocabularyData?: IVocabularyData; // vocabulary-specific data
  lastUpdated?: Date; // Custom lastUpdated field
  
  // Instance methods
  getTagString(): string;
  isVocabulary(): boolean;
}

/**
 * Interface for static methods
 */
export interface IConceptModel {
  findByTags(tags: string[]): Promise<IConcept[]>;
  getPopularTags(limit?: number): Promise<{ tag: string; count: number }[]>;
}

const VocabularyDataSchema = new Schema<IVocabularyData>(
  {
    word: { 
      type: String, 
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100
    },
    translation: { 
      type: String, 
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200
    },
    partOfSpeech: { 
      type: String, 
      required: true,
      enum: ALLOWED_PARTS_OF_SPEECH,
      lowercase: true
    },
    gender: { 
      type: String,
      enum: ["masculine", "feminine", "neuter"],
      lowercase: true
    },
    pluralForm: { 
      type: String,
      trim: true,
      maxlength: 100
    },
    pronunciation: { 
      type: String,
      trim: true,
      maxlength: 200
    },
  },
  { _id: false }
);

/**
 * Tag validation function
 */
function validateTags(tags: string[]): boolean {
  if (tags.length > 10) return false;
  return tags.every(tag => {
    if (typeof tag !== 'string') return false;
    const trimmed = tag.trim();
    return trimmed.length >= 1 && trimmed.length <= 50 && /^[a-zA-Z0-9\s-]+$/.test(trimmed);
  });
}


const ConceptSchema = new Schema<IConcept>(
  {
    id: { type: String, required: true, unique: true },
    name: { 
      type: String, 
      required: true, 
      trim: true,
      minlength: 1,
      maxlength: 100
    },
    category: {
      type: String,
      enum: Object.values(ConceptCategory),
      required: true,
    },
    description: { 
      type: String, 
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000
    },
    examples: { 
      type: [String], 
      default: [],
      validate: {
        validator: function(examples: string[]) {
          return examples.length <= 30;
        },
        message: 'Maximum 30 examples allowed'
      }
    },
    difficulty: {
      type: String,
      enum: Object.values(QuestionLevel),
      required: true,
    },
    tags: { 
      type: [String], 
      default: [],
      validate: {
        validator: validateTags,
        message: 'Tags must be 1-50 characters, contain only letters, numbers, spaces, and hyphens, and maximum 10 tags allowed'
      }
    },
    sourceType: {
      type: String,
      enum: ["course", "document", "manual", "import"],
      default: "course",
    },
    isActive: { type: Boolean, default: true },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0,
    },
    createdFrom: { type: [String], default: [] },
    vocabularyData: { type: VocabularyDataSchema },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Pre-save hooks for validation and normalization
ConceptSchema.pre('save', function(next) {
  // Tag normalization
  if (this.tags && this.tags.length > 0) {
    this.tags = this.tags
      .map(tag => tag.trim().toLowerCase())
      .filter((tag, index, arr) => tag && arr.indexOf(tag) === index); // Remove duplicates and empty strings
  }
  
  // Vocabulary data validation
  if (this.category === ConceptCategory.VOCABULARY) {
    if (!this.vocabularyData) {
      return next(new Error('Vocabulary concepts must have vocabularyData'));
    }
    
    // Ensure vocabularyData.word matches concept.name for vocabulary concepts
    if (this.vocabularyData.word.toLowerCase() !== this.name.toLowerCase()) {
      return next(new Error('For vocabulary concepts, vocabularyData.word must match concept.name'));
    }
  }
  
  next();
});

// Create indexes for performance with optimization options
ConceptSchema.index({ name: 1, category: 1 }, { unique: true, background: true });
ConceptSchema.index({ difficulty: 1, isActive: 1 }, { background: true });
ConceptSchema.index({ createdFrom: 1 }, { background: true });

// Enhanced indexing strategy
ConceptSchema.index({ tags: 1, difficulty: 1, isActive: 1 }, { background: true });
ConceptSchema.index({ sourceType: 1, isActive: 1 }, { background: true });
ConceptSchema.index({ 'vocabularyData.word': 1 }, { sparse: true, background: true });

// Text search index for comprehensive search
ConceptSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text' 
}, { 
  background: true,
  weights: {
    name: 10,
    tags: 5,
    description: 1
  }
});

// Instance methods
ConceptSchema.methods.getTagString = function(): string {
  return this.tags.join(', ');
};

ConceptSchema.methods.isVocabulary = function(): boolean {
  return this.category === ConceptCategory.VOCABULARY;
};

// Static methods
ConceptSchema.statics.findByTags = function(tags: string[]): Promise<IConcept[]> {
  const normalizedTags = tags.map(tag => tag.trim().toLowerCase());
  return this.find({ 
    tags: { $in: normalizedTags },
    isActive: true 
  })
  .sort({ createdAt: -1 })
  .lean();
};

ConceptSchema.statics.getPopularTags = function(limit: number = 20): Promise<{ tag: string; count: number }[]> {
  return this.aggregate([
    { $match: { isActive: true } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { tag: '$_id', count: 1, _id: 0 } }
  ]);
};

// Performance optimization: Query hints for common patterns
// Note: Commented out due to TypeScript issues with custom query helpers
// ConceptSchema.query.byCategory = function(category: ConceptCategory) {
//   return this.find({ category, isActive: true }).hint({ category: 1, isActive: 1 });
// };

// ConceptSchema.query.byDifficulty = function(difficulty: QuestionLevel) {
//   return this.find({ difficulty, isActive: true }).hint({ difficulty: 1, isActive: 1 });
// };

// ConceptSchema.query.active = function() {
//   return this.find({ isActive: true }).hint({ isActive: 1 });
// };

const Concept = models?.Concept || model<IConcept>("Concept", ConceptSchema);

export default Concept;
