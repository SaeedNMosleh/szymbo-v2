/**
 * Duplication Detection Service
 * 
 * This service provides clear separation between:
 * - Duplicates: 100% same concept name (case-insensitive)
 * - Similarities: Concepts that are similar but not identical
 */

import Concept, { IConcept } from "@/datamodels/concept.model";
import { ExtractedConcept } from "@/datamodels/conceptExtractionSession.model";
import { ConceptCategory } from "@/lib/enum";

export interface DuplicateMatch {
  extractedConceptName: string;
  existingConcept: IConcept;
  duplicateType: "exact" | "case_insensitive";
}

export interface DuplicationCheckResult {
  hasDuplicates: boolean;
  duplicates: DuplicateMatch[];
  duplicateConceptNames: string[];
}

export class DuplicationDetector {
  /**
   * Check for exact duplicates in a list of extracted concepts
   * @param extractedConcepts Array of extracted concepts to check
   * @param category Optional category filter
   * @returns Duplication check result
   */
  async checkForDuplicates(
    extractedConcepts: ExtractedConcept[],
    category?: ConceptCategory
  ): Promise<DuplicationCheckResult> {
    try {
      const duplicates: DuplicateMatch[] = [];
      const duplicateConceptNames: string[] = [];

      for (const extractedConcept of extractedConcepts) {
        const duplicate = await this.findExactDuplicate(
          extractedConcept.name,
          extractedConcept.category,
          category
        );

        if (duplicate) {
          duplicates.push({
            extractedConceptName: extractedConcept.name,
            existingConcept: duplicate.concept,
            duplicateType: duplicate.type,
          });
          duplicateConceptNames.push(extractedConcept.name);
        }
      }

      return {
        hasDuplicates: duplicates.length > 0,
        duplicates,
        duplicateConceptNames,
      };
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      return {
        hasDuplicates: false,
        duplicates: [],
        duplicateConceptNames: [],
      };
    }
  }

  /**
   * Find exact duplicate for a single concept
   * IMPORTANT: Only checks for EXACT NAME matches, not similarities
   * @param conceptName Name of the concept to check
   * @param conceptCategory Category of the concept
   * @param filterCategory Optional category filter
   * @returns Duplicate match information or null
   */
  async findExactDuplicate(
    conceptName: string,
    conceptCategory: ConceptCategory,
    filterCategory?: ConceptCategory
  ): Promise<{ concept: IConcept; type: "exact" | "case_insensitive" } | null> {
    try {
      const trimmedName = conceptName.trim();

      // Build query - always check within the same category
      const baseQuery = {
        category: conceptCategory,
        isActive: true,
      };

      // Apply additional category filter if provided
      const query = filterCategory
        ? { ...baseQuery, category: filterCategory }
        : baseQuery;

      // ONLY check for EXACT name matches (case-insensitive)
      // This is TRUE duplication: same name = duplicate
      const exactMatch = await Concept.findOne({
        ...query,
        name: new RegExp(`^${this.escapeRegex(trimmedName)}$`, "i"),
      });

      if (exactMatch) {
        // Determine if it's exact case match or case-insensitive match
        const isExactCase = exactMatch.name === trimmedName;
        return {
          concept: exactMatch.toObject(),
          type: isExactCase ? "exact" : "case_insensitive",
        };
      }

      return null;
    } catch (error) {
      console.error(
        `Error finding duplicate for concept "${conceptName}":`,
        error
      );
      return null;
    }
  }

  /**
   * Check if a single concept name is a duplicate
   * @param conceptName Name to check
   * @param conceptCategory Category to check within
   * @returns True if duplicate exists, false otherwise
   */
  async isDuplicate(
    conceptName: string,
    conceptCategory: ConceptCategory
  ): Promise<boolean> {
    const duplicate = await this.findExactDuplicate(conceptName, conceptCategory);
    return duplicate !== null;
  }

  /**
   * Get all duplicate concept names from a list of extracted concepts
   * @param extractedConcepts Array of extracted concepts
   * @returns Array of concept names that are duplicates
   */
  async getDuplicateConceptNames(
    extractedConcepts: ExtractedConcept[]
  ): Promise<string[]> {
    const result = await this.checkForDuplicates(extractedConcepts);
    return result.duplicateConceptNames;
  }

  /**
   * Validate that extracted concepts can be created (no duplicates)
   * @param extractedConcepts Array of extracted concepts to validate
   * @returns Validation result with details
   */
  async validateConceptsForCreation(
    extractedConcepts: ExtractedConcept[]
  ): Promise<{
    isValid: boolean;
    message: string;
    duplicates: DuplicateMatch[];
  }> {
    const duplicationResult = await this.checkForDuplicates(extractedConcepts);

    if (duplicationResult.hasDuplicates) {
      const duplicateNames = duplicationResult.duplicateConceptNames.join(", ");
      return {
        isValid: false,
        message: `Cannot create concepts due to duplicates: ${duplicateNames}. Please review and edit these concepts to have unique names.`,
        duplicates: duplicationResult.duplicates,
      };
    }

    return {
      isValid: true,
      message: "All concepts are valid for creation",
      duplicates: [],
    };
  }

  /**
   * Get detailed duplication report for review UI
   * @param extractedConcepts Array of extracted concepts
   * @returns Detailed report for UI display
   */
  async getDuplicationReport(extractedConcepts: ExtractedConcept[]): Promise<{
    totalConcepts: number;
    duplicateCount: number;
    duplicateDetails: Array<{
      extractedName: string;
      existingName: string;
      existingId: string;
      existingCategory: ConceptCategory;
      duplicateType: "exact" | "case_insensitive";
      recommendedAction: string;
    }>;
  }> {
    const duplicationResult = await this.checkForDuplicates(extractedConcepts);

    const duplicateDetails = duplicationResult.duplicates.map((duplicate) => ({
      extractedName: duplicate.extractedConceptName,
      existingName: duplicate.existingConcept.name,
      existingId: duplicate.existingConcept.id,
      existingCategory: duplicate.existingConcept.category,
      duplicateType: duplicate.duplicateType,
      recommendedAction:
        duplicate.duplicateType === "exact"
          ? "Edit the concept name to make it unique"
          : "Consider if this is the same concept or edit the name",
    }));

    return {
      totalConcepts: extractedConcepts.length,
      duplicateCount: duplicationResult.duplicates.length,
      duplicateDetails,
    };
  }

  /**
   * Escape special regex characters
   * @param string String to escape
   * @returns Escaped string safe for regex
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Get concepts that are safe to create (no duplicates)
   * @param extractedConcepts Array of extracted concepts
   * @returns Array of concepts that can be safely created
   */
  async getCreatableConcepts(
    extractedConcepts: ExtractedConcept[]
  ): Promise<ExtractedConcept[]> {
    const duplicationResult = await this.checkForDuplicates(extractedConcepts);
    
    return extractedConcepts.filter(
      (concept) => !duplicationResult.duplicateConceptNames.includes(concept.name)
    );
  }

  /**
   * Get concepts that have duplicates and need user attention
   * @param extractedConcepts Array of extracted concepts
   * @returns Array of concepts that have duplicates
   */
  async getDuplicateConcepts(
    extractedConcepts: ExtractedConcept[]
  ): Promise<ExtractedConcept[]> {
    const duplicationResult = await this.checkForDuplicates(extractedConcepts);
    
    return extractedConcepts.filter(
      (concept) => duplicationResult.duplicateConceptNames.includes(concept.name)
    );
  }
}

/**
 * Factory function for creating duplication detector
 * @returns DuplicationDetector instance
 */
export function createDuplicationDetector(): DuplicationDetector {
  return new DuplicationDetector();
}

/**
 * Singleton instance for reuse across the application
 */
export const duplicationDetector = new DuplicationDetector();