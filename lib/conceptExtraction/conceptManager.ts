import Concept, { IConcept } from "@/datamodels/concept.model";
import {
  IConceptIndex,
  createConceptIndex,
} from "@/datamodels/conceptIndex.model";
import CourseConcept, {
  ICourseConcept,
} from "@/datamodels/courseConcept.model";
import { ConceptLLMService } from "./conceptLLM";
import {
  ExtractedConcept,
  SimilarityMatch,
  ConceptValidationError,
} from "./types";
import { ConceptCategory } from "@/lib/enum";

import { v4 as uuidv4 } from "uuid";

/**
 * Service responsible for managing concepts and their relationships
 */
export class ConceptManager {
  private llmService: ConceptLLMService;
  private conceptIndexCache: IConceptIndex[] | null = null;
  private cacheTimestamp: number = 0;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Initialize with optional LLM service for dependency injection
   * @param llmService Optional LLM service implementation
   */
  constructor(llmService?: ConceptLLMService) {
    this.llmService = llmService || new ConceptLLMService();
  }

  /**
   * Create a new concept with validation
   * @param conceptData Data for the new concept
   * @returns The created concept
   */
  async createConcept(conceptData: Partial<IConcept>): Promise<IConcept> {
    try {
      // Validate required fields
      if (
        !conceptData.name ||
        !conceptData.category ||
        !conceptData.description
      ) {
        throw new ConceptValidationError(
          "Missing required fields: name, category, or description"
        );
      }

      // Check for duplicates
      const isDuplicate = await this.validateConceptUniqueness(
        conceptData.name,
        conceptData.category as ConceptCategory
      );

      if (!isDuplicate) {
        throw new ConceptValidationError(
          `Concept "${conceptData.name}" already exists in category "${conceptData.category}"`
        );
      }

      // Generate unique ID if not provided
      const newConcept: IConcept = {
        ...conceptData,
        id: conceptData.id || uuidv4(),
        isActive:
          conceptData.isActive !== undefined ? conceptData.isActive : true,
        confidence:
          conceptData.confidence !== undefined ? conceptData.confidence : 1,
        examples: conceptData.examples || [],
        prerequisites: conceptData.prerequisites || [],
        relatedConcepts: conceptData.relatedConcepts || [],
        createdFrom: conceptData.createdFrom || [],
        lastUpdated: new Date(),
      } as IConcept;

      // Save to database
      const conceptModel = new Concept(newConcept);
      const savedConcept = await conceptModel.save();

      // Invalidate cache
      this.invalidateCache();

      return savedConcept.toObject();
    } catch (error) {
      if (error instanceof ConceptValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to create concept: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update an existing concept
   * @param conceptId ID of the concept to update
   * @param updates Partial updates to apply
   * @returns The updated concept
   */
  async updateConcept(
    conceptId: string,
    updates: Partial<IConcept>
  ): Promise<IConcept> {
    try {
      // Find the existing concept
      const existingConcept = await Concept.findOne({ id: conceptId });
      if (!existingConcept) {
        throw new ConceptValidationError(
          `Concept with ID ${conceptId} not found`
        );
      }

      // If name or category is being changed, check uniqueness
      if (
        (updates.name && updates.name !== existingConcept.name) ||
        (updates.category && updates.category !== existingConcept.category)
      ) {
        const isUnique = await this.validateConceptUniqueness(
          updates.name || existingConcept.name,
          (updates.category as ConceptCategory) || existingConcept.category
        );
        if (!isUnique) {
          throw new ConceptValidationError(
            "A concept with this name and category already exists"
          );
        }
      }

      // Update lastUpdated timestamp
      updates.lastUpdated = new Date();

      // Apply updates
      const updatedConcept = await Concept.findOneAndUpdate(
        { id: conceptId },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!updatedConcept) {
        throw new ConceptValidationError(
          `Failed to update concept with ID ${conceptId}`
        );
      }

      // Invalidate cache
      this.invalidateCache();

      return updatedConcept.toObject();
    } catch (error) {
      if (error instanceof ConceptValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to update concept: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a concept by ID
   * @param conceptId ID of the concept to retrieve
   * @returns The concept or null if not found
   */
  async getConcept(conceptId: string): Promise<IConcept | null> {
    try {
      const concept = await Concept.findOne({ id: conceptId });
      return concept ? concept.toObject() : null;
    } catch (error) {
      console.error(`Error fetching concept ${conceptId}:`, error);
      return null;
    }
  }

  /**
   * Get all active concepts
   * @param page Page number for pagination
   * @param limit Items per page
   * @returns Array of active concepts
   */
  async getActiveConcepts(
    page: number = 1,
    limit: number = 100
  ): Promise<IConcept[]> {
    try {
      const skip = (page - 1) * limit;
      const concepts = await Concept.find({ isActive: true })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      return concepts.map((concept) => concept.toObject());
    } catch (error) {
      console.error("Error fetching active concepts:", error);
      return [];
    }
  }

  /**
   * Rebuild the concept index from the database
   * @returns Array of concept indexes
   */
  async rebuildConceptIndex(): Promise<IConceptIndex[]> {
    try {
      const concepts = await Concept.find({ isActive: true });
      const conceptIndexes = concepts.map((concept) =>
        createConceptIndex(concept.toObject())
      );

      // Update cache
      this.conceptIndexCache = conceptIndexes;
      this.cacheTimestamp = Date.now();

      return conceptIndexes;
    } catch (error) {
      console.error("Error rebuilding concept index:", error);
      return [];
    }
  }

  /**
   * Get the concept index, using cache if available
   * @param forceRefresh Force a cache refresh
   * @returns Array of concept indexes
   */
  async getConceptIndex(
    forceRefresh: boolean = false
  ): Promise<IConceptIndex[]> {
    // If cache is valid and not forced to refresh, return cache
    if (
      !forceRefresh &&
      this.conceptIndexCache &&
      Date.now() - this.cacheTimestamp < this.cacheTTL
    ) {
      return this.conceptIndexCache;
    }

    // Otherwise rebuild the index
    return this.rebuildConceptIndex();
  }

  /**
   * Invalidate the concept index cache
   */
  private invalidateCache(): void {
    this.conceptIndexCache = null;
  }

  /**
   * Link a concept to a course
   * @param conceptId ID of the concept
   * @param courseId ID of the course
   * @param confidence Confidence score for the link
   * @param sourceContent Source content where the concept was found
   */
  async linkConceptToCourse(
    conceptId: string,
    courseId: number,
    confidence: number,
    sourceContent: string
  ): Promise<void> {
    try {
      // Validate inputs
      if (!conceptId || !courseId) {
        throw new ConceptValidationError(
          "Missing required fields: conceptId or courseId"
        );
      }

      // Normalize confidence score
      const normalizedConfidence = Math.max(0, Math.min(1, confidence));

      // Check if link already exists
      const existingLink = await CourseConcept.findOne({
        conceptId,
        courseId,
      });

      if (existingLink) {
        // Update existing link
        await CourseConcept.updateOne(
          { conceptId, courseId },
          {
            $set: {
              confidence: normalizedConfidence,
              sourceContent,
              isActive: true,
              extractedDate: new Date(),
            },
          }
        );
      } else {
        // Create new link
        const courseConceptData: ICourseConcept = {
          conceptId,
          courseId,
          confidence: normalizedConfidence,
          sourceContent,
          isActive: true,
          extractedDate: new Date(),
        };

        const courseConcept = new CourseConcept(courseConceptData);
        await courseConcept.save();
      }
    } catch (error) {
      if (error instanceof ConceptValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to link concept to course: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all concepts linked to a specific course
   * @param courseId ID of the course
   * @returns Array of concepts
   */
  async getConceptsForCourse(courseId: number): Promise<IConcept[]> {
    try {
      // Find all active course-concept links for the course
      const courseConceptLinks = await CourseConcept.find({
        courseId,
        isActive: true,
      });

      if (!courseConceptLinks.length) {
        return [];
      }

      // Extract concept IDs
      const conceptIds = courseConceptLinks.map((link) => link.conceptId);

      // Fetch the concepts
      const concepts = await Concept.find({
        id: { $in: conceptIds },
        isActive: true,
      });

      return concepts.map((concept) => concept.toObject());
    } catch (error) {
      console.error(`Error fetching concepts for course ${courseId}:`, error);
      return [];
    }
  }

  /**
   * Get all courses that contain a specific concept
   * @param conceptId ID of the concept
   * @returns Array of course IDs
   */
  async getCoursesForConcept(conceptId: string): Promise<number[]> {
    try {
      // Find all active course-concept links for the concept
      const courseConceptLinks = await CourseConcept.find({
        conceptId,
        isActive: true,
      }).sort({ confidence: -1 }); // Sort by confidence descending

      // Extract course IDs
      return courseConceptLinks.map((link) => link.courseId);
    } catch (error) {
      console.error(`Error fetching courses for concept ${conceptId}:`, error);
      return [];
    }
  }

  /**
   * Find similar concepts using LLM
   * @param extractedConcept The extracted concept to compare
   * @returns Array of similarity matches
   */
  async findSimilarConcepts(
    extractedConcept: ExtractedConcept
  ): Promise<SimilarityMatch[]> {
    try {
      // Get concept index
      const conceptIndex = await this.getConceptIndex();

      if (!conceptIndex.length) {
        return [];
      }

      // Use LLM service for similarity check
      const similarityMatches = await this.llmService.checkConceptSimilarity(
        extractedConcept,
        conceptIndex
      );

      // Filter out low-similarity matches
      return similarityMatches.filter((match) => match.similarity >= 0.3);
    } catch (error) {
      console.error(
        `Error finding similar concepts for "${extractedConcept.name}":`,
        error
      );
      return [];
    }
  }

  /**
   * Check if a concept with the given name and category already exists
   * @param name Name to check
   * @param category Category to check
   * @returns True if concept is unique, false otherwise
   */
  async validateConceptUniqueness(
    name: string,
    category: ConceptCategory
  ): Promise<boolean> {
    try {
      // Check for exact match
      const exactMatch = await Concept.findOne({
        name: new RegExp(`^${name.trim()}$`, "i"), // Case-insensitive exact match
        category,
      });

      if (exactMatch) {
        return false;
      }

      // Also check for very similar names in the same category
      const similarNames = await Concept.find({
        name: new RegExp(
          name
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 3)
            .join("|"),
          "i"
        ),
        category,
      });

      // If we find more than 3 words in common with an existing concept, consider it a duplicate
      for (const concept of similarNames) {
        const nameWords = name.toLowerCase().split(/\s+/);
        const existingNameWords = concept.name.toLowerCase().split(/\s+/);

        const commonWords = nameWords.filter(
          (word) => word.length > 3 && existingNameWords.includes(word)
        );

        if (commonWords.length >= 3) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(
        `Error validating concept uniqueness for "${name}":`,
        error
      );
      return true; // Assume unique in case of error
    }
  }

  /**
   * Get concepts with pagination and filtering
   * @param options Options for pagination and filtering
   * @returns Object with success status, data and total count
   */
  async getConceptsPaginated(options: {
    page?: number;
    limit?: number;
    category?: ConceptCategory | null;
    isActive?: boolean;
  }) {
    const { page = 1, limit = 20, category = null, isActive = true } = options;

    try {
      // Build query based on filters
      const query: Record<string, any> = {};

      // Filter by active status
      if (isActive !== null) {
        query.isActive = isActive;
      }

      // Filter by category
      if (category) {
        query.category = category;
      }

      // Get total count for pagination
      const total = await Concept.countDocuments(query);

      // Get paginated data
      const skip = (page - 1) * limit;
      const concepts = await Concept.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      return {
        success: true,
        data: concepts.map((concept) => concept.toObject()),
        total,
      };
    } catch (error) {
      console.error("Error fetching paginated concepts:", error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Factory function for dependency injection
 * @param llmService Optional LLM service implementation
 * @returns ConceptManager instance
 */
export function createConceptManager(
  llmService?: ConceptLLMService
): ConceptManager {
  return new ConceptManager(llmService);
}
