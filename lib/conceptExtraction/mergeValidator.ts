/**
 * Merge Validation Utilities
 * 
 * Provides validation functions for concept merging operations
 * in both concept review and concept management hub.
 */

import { ConceptCategory } from "@/lib/enum";
import { IConcept } from "@/datamodels/concept.model";

export interface ConceptSummary {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  tags: string[];
  isActive?: boolean;
  lastUpdated?: string;
}

export interface MergeValidationResult {
  isValid: boolean;
  error?: string;
  errorType?: 'category_incompatible' | 'insufficient_concepts' | 'inactive_concepts';
}

export interface MergePreviewData {
  primaryConcept: ConceptSummary;
  secondaryConcepts: ConceptSummary[];
  mergedPreview: {
    name: string;
    category: string;
    description: string;
    examples: string[];
    tags: string[];
    difficulty: string;
  };
  sourceData: {
    totalExamples: number;
    uniqueTags: number;
    sourceDescriptions: string[];
    conceptNames: string[];
  };
}

/**
 * Validates if selected concepts can be merged together
 * @param concepts Array of concepts to validate for merging
 * @returns Validation result with error details if invalid
 */
export function validateMergeCompatibility(concepts: ConceptSummary[]): MergeValidationResult {
  // Check minimum concept count
  if (concepts.length < 2) {
    return {
      isValid: false,
      error: "At least 2 concepts must be selected for merging.",
      errorType: 'insufficient_concepts'
    };
  }

  // Check for active concepts only
  const inactiveConcepts = concepts.filter(c => c.isActive === false);
  if (inactiveConcepts.length > 0) {
    return {
      isValid: false,
      error: `Cannot merge inactive concepts: ${inactiveConcepts.map(c => c.name).join(', ')}`,
      errorType: 'inactive_concepts'
    };
  }

  // Get unique categories
  const categories = [...new Set(concepts.map(c => c.category.toLowerCase()))];
  
  // Check for Grammar + Vocabulary incompatibility
  if (categories.includes(ConceptCategory.GRAMMAR.toLowerCase()) && 
      categories.includes(ConceptCategory.VOCABULARY.toLowerCase())) {
    return {
      isValid: false,
      error: "⚠️ Cannot merge Grammar and Vocabulary concepts.\n\nThese represent different types of learning content and should remain separate. Please select concepts from the same category.",
      errorType: 'category_incompatible'
    };
  }

  // All validations passed
  return { isValid: true };
}

/**
 * Prepares a preview of what the merged concept would look like
 * @param concepts Array of concepts to merge (first one becomes primary)
 * @returns Preview data for the merge dialog
 */
export function prepareMergePreview(concepts: ConceptSummary[]): MergePreviewData {
  const [primary, ...secondary] = concepts;
  
  // Aggregate examples from all concepts
  const allExamples: string[] = [];
  concepts.forEach(concept => {
    // For now, we'll assume examples might be in description or need to be fetched
    // This will be enhanced when we have full concept data
  });

  // Aggregate tags from all concepts
  const allTags = concepts.flatMap(c => c.tags || []);
  const uniqueTags = [...new Set(allTags.filter(tag => tag.trim() !== ''))];

  // Prepare descriptions list
  const sourceDescriptions = concepts
    .map(c => c.name) // For now, using names as placeholder for descriptions
    .filter(desc => desc && desc.trim() !== '');

  // Create merged preview
  const mergedPreview = {
    name: primary.name, // Primary concept keeps its name
    category: primary.category,
    description: `Merged concept combining: ${concepts.map(c => c.name).join(', ')}`,
    examples: [], // Will be populated with full concept data
    tags: uniqueTags,
    difficulty: primary.difficulty, // Primary concept's difficulty
  };

  return {
    primaryConcept: primary,
    secondaryConcepts: secondary,
    mergedPreview,
    sourceData: {
      totalExamples: allExamples.length,
      uniqueTags: uniqueTags.length,
      sourceDescriptions,
      conceptNames: concepts.map(c => c.name),
    }
  };
}

/**
 * Validates concept categories for specific merge rules
 * @param categories Array of category strings
 * @returns True if categories are compatible for merging
 */
export function areCategoriesCompatible(categories: string[]): boolean {
  const uniqueCategories = [...new Set(categories.map(c => c.toLowerCase()))];
  
  // Grammar and Vocabulary cannot be merged
  const hasGrammar = uniqueCategories.includes(ConceptCategory.GRAMMAR.toLowerCase());
  const hasVocabulary = uniqueCategories.includes(ConceptCategory.VOCABULARY.toLowerCase());
  
  return !(hasGrammar && hasVocabulary);
}

/**
 * Gets user-friendly error message for merge validation failures
 * @param validationResult Result from validateMergeCompatibility
 * @returns Formatted error message for UI display
 */
export function getMergeErrorMessage(validationResult: MergeValidationResult): string {
  if (validationResult.isValid) return '';
  
  switch (validationResult.errorType) {
    case 'category_incompatible':
      return "⚠️ Category Incompatibility\n\nGrammar and Vocabulary concepts represent different types of learning content and cannot be merged together. Please select concepts from compatible categories.";
    
    case 'insufficient_concepts':
      return "📋 Selection Required\n\nPlease select at least 2 concepts to perform a merge operation.";
    
    case 'inactive_concepts':
      return "🚫 Inactive Concepts\n\nOne or more selected concepts are inactive and cannot be merged. Please select only active concepts.";
    
    default:
      return validationResult.error || 'Unknown merge validation error';
  }
}

/**
 * Prepares merge data for API submission
 * @param primaryConcept The concept that will be the merge target
 * @param secondaryConcepts Concepts to be merged into the primary
 * @param finalConceptData User-edited final concept data
 * @returns Data structure for merge API call
 */
export function prepareMergeApiData(
  primaryConcept: ConceptSummary,
  secondaryConcepts: ConceptSummary[],
  finalConceptData: Partial<IConcept>
) {
  return {
    targetConceptId: primaryConcept.id,
    sourceConceptIds: secondaryConcepts.map(c => c.id),
    finalConceptData,
    mergeMetadata: {
      mergedConceptNames: secondaryConcepts.map(c => c.name),
      totalConcepts: secondaryConcepts.length + 1,
      mergeDate: new Date().toISOString(),
    }
  };
}