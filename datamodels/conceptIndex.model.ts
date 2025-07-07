import { ConceptCategory, QuestionLevel } from "@/lib/enum";
import { IConcept } from "./concept.model";

/**
 * Lightweight model for LLM operations with concepts
 * No MongoDB schema needed - this is computed/cached data
 * Will be generated from full Concept documents
 * @interface IConceptIndex
 */
export interface IConceptIndex {
  conceptId: string;
  name: string;
  category: ConceptCategory;
  description: string; // brief only, no examples
  difficulty: QuestionLevel;
  isActive: boolean;
}

/**
 * Export a function to create a concept index from a full concept
 * Used for generating lightweight representations for LLM operations
 * @param concept Full concept document
 * @returns Lightweight concept index
 */
export const createConceptIndex = (concept: IConcept): IConceptIndex => {
  return {
    conceptId: concept.id,
    name: concept.name,
    category: concept.category,
    description: concept.description,
    difficulty: concept.difficulty,
    isActive: concept.isActive,
  };
};

/**
 * Utility function to create concept indexes in bulk
 * @param concepts Array of full concept documents
 * @returns Array of lightweight concept indexes
 */
export const createConceptIndexes = (concepts: IConcept[]): IConceptIndex[] => {
  return concepts.map(createConceptIndex);
};