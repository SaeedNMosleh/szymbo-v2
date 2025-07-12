// lib/conceptExtraction/conceptManager.ts - ENHANCED VERSION
import Concept, { IConcept } from "@/datamodels/concept.model";
import {
  IConceptIndex,
  createConceptIndex,
} from "@/datamodels/conceptIndex.model";
import CourseConcept, {
  ICourseConcept,
} from "@/datamodels/courseConcept.model";
import ConceptExtractionSession, {
  IConceptExtractionSession,
  ExtractedConcept as SessionExtractedConcept,
} from "@/datamodels/conceptExtractionSession.model";
import { ConceptLLMService } from "./conceptLLM";
import {
  ExtractedConcept,
  SimilarityMatch,
  ConceptValidationError,
} from "./types";
import { ConceptCategory } from "@/lib/enum";
import { SRSCalculator } from "@/lib/practiceEngine/srsCalculator";

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
   * Create a new concept with validation and duplicate handling
   * @param conceptData Data for the new concept
   * @param skipUniquenessCheck Skip uniqueness validation
   * @returns The created or existing concept
   */
  async createConcept(
    conceptData: Partial<IConcept>,
    skipUniquenessCheck: boolean = false
  ): Promise<IConcept> {
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

      // Check if concept already exists (even when skipping uniqueness check)
      const existingConcept = await Concept.findOne({
        name: new RegExp(`^${conceptData.name.trim()}$`, "i"),
        category: conceptData.category,
        isActive: true,
      });

      if (existingConcept) {
        if (skipUniquenessCheck) {
          console.log(
            `Concept "${conceptData.name}" already exists, returning existing concept`
          );
          return existingConcept.toObject();
        } else {
          throw new ConceptValidationError(
            `Concept "${conceptData.name}" already exists in category "${conceptData.category}"`
          );
        }
      }

      // Only check detailed uniqueness if not skipping and no exact match found
      if (!skipUniquenessCheck) {
        const isUnique = await this.validateConceptUniqueness(
          conceptData.name,
          conceptData.category as ConceptCategory
        );

        if (!isUnique) {
          throw new ConceptValidationError(
            `Concept "${conceptData.name}" already exists in category "${conceptData.category}"`
          );
        }
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

      // Initialize concept progress for default user to make it available for practice
      try {
        await SRSCalculator.initializeConceptProgress(
          savedConcept.id,
          "default"
        );
        console.log(
          `Initialized practice progress for concept: ${savedConcept.name}`
        );
      } catch {
        // Don't fail the concept creation if progress initialization fails
      }

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
   * Enhanced method to create or find existing concept
   * @param conceptData Data for the concept
   * @returns The created or existing concept
   */
  async createOrFindConcept(conceptData: Partial<IConcept>): Promise<IConcept> {
    try {
      // First try to find existing concept
      const existingConcept = await Concept.findOne({
        name: new RegExp(`^${conceptData.name?.trim()}$`, "i"),
        category: conceptData.category,
        isActive: true,
      });

      if (existingConcept) {
        console.log(`Found existing concept: ${existingConcept.name}`);

        // Update createdFrom if this course isn't already listed
        if (conceptData.createdFrom && conceptData.createdFrom.length > 0) {
          const newCourseId = conceptData.createdFrom[0];
          if (!existingConcept.createdFrom.includes(newCourseId)) {
            existingConcept.createdFrom.push(newCourseId);
            existingConcept.lastUpdated = new Date();
            await existingConcept.save();
          }
        }

        // Ensure progress is initialized
        try {
          await SRSCalculator.initializeConceptProgress(
            existingConcept.id,
            "default"
          );
        } catch {
          // Progress might already exist, which is fine
        }

        return existingConcept.toObject();
      }

      // Create new concept if not found
      return await this.createConcept(conceptData, true);
    } catch (error) {
      console.error(
        `Error in createOrFindConcept for "${conceptData.name}":`,
        error
      );
      throw error;
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
   * Link a concept to a course with enhanced error handling
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

      // Verify concept exists
      const concept = await this.getConcept(conceptId);
      if (!concept) {
        throw new ConceptValidationError(
          `Concept with ID ${conceptId} not found`
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
        console.log(
          `Updated link between concept ${conceptId} and course ${courseId}`
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
        console.log(
          `Created new link between concept ${conceptId} and course ${courseId}`
        );
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
        isActive: true,
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
        isActive: true,
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
      const query: {
        isActive?: boolean;
        category?: ConceptCategory;
      } = {};

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

  /**
   * Get extraction sessions for a course
   * @param courseId ID of the course
   * @param status Optional status filter
   * @returns Array of extraction sessions
   */
  async getExtractionSessions(
    courseId: number,
    status?: "extracted" | "in_review" | "reviewed" | "archived"
  ): Promise<IConceptExtractionSession[]> {
    try {
      const query: { courseId: number; status?: string } = { courseId };
      if (status) {
        query.status = status;
      }

      const sessionDocs = await ConceptExtractionSession.find(query)
        .sort({ extractionDate: -1 })
        .lean();

      const sessions = sessionDocs as unknown as IConceptExtractionSession[];

      return sessions;
    } catch (error) {
      console.error(
        `Error fetching extraction sessions for course ${courseId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get the latest active extraction session for a course
   * @param courseId ID of the course
   * @returns Latest extraction session or null
   */
  async getLatestExtractionSession(
    courseId: number
  ): Promise<IConceptExtractionSession | null> {
    try {
      const session = (await ConceptExtractionSession.findOne({
        courseId,
        status: { $in: ["extracted", "in_review"] },
      })
        .sort({ extractionDate: -1 })
        .lean()) as IConceptExtractionSession | null;

      return session;
    } catch (error) {
      console.error(
        `Error fetching latest extraction session for course ${courseId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Create concept from session extracted concept
   * @param extractedConcept Extracted concept from session
   * @param courseId Source course ID
   * @returns Created concept
   */
  async createConceptFromSession(
    extractedConcept: SessionExtractedConcept,
    courseId: number
  ): Promise<IConcept> {
    const conceptData: Partial<IConcept> = {
      id: uuidv4(),
      name: extractedConcept.name,
      category: extractedConcept.category,
      description: extractedConcept.description,
      examples: extractedConcept.examples,
      difficulty: extractedConcept.suggestedDifficulty,
      confidence: extractedConcept.confidence,
      createdFrom: [courseId.toString()],
      isActive: true,
      lastUpdated: new Date(),
      prerequisites: [],
      relatedConcepts: [],
    };

    const concept = await this.createOrFindConcept(conceptData);

    // Link to course
    await this.linkConceptToCourse(
      concept.id,
      courseId,
      extractedConcept.confidence,
      extractedConcept.sourceContent
    );

    return concept;
  }

  /**
   * Merge concept data from session into existing concept
   * @param targetConceptId ID of the target concept
   * @param extractedConcept Extracted concept data
   * @param additionalData Additional data to merge
   * @param courseId Source course ID
   */
  async mergeConceptFromSession(
    targetConceptId: string,
    extractedConcept: SessionExtractedConcept,
    additionalData: { examples?: string[]; description?: string },
    courseId: number
  ): Promise<void> {
    const existingConcept = await this.getConcept(targetConceptId);
    if (!existingConcept) {
      throw new ConceptValidationError(
        `Target concept ${targetConceptId} not found`
      );
    }

    const updates: Partial<IConcept> = {
      lastUpdated: new Date(),
    };

    // Merge examples
    if (additionalData.examples && Array.isArray(additionalData.examples)) {
      const existingExamples = existingConcept.examples || [];
      const newExamples = additionalData.examples.filter(
        (example: string) => !existingExamples.includes(example)
      );
      if (newExamples.length > 0) {
        updates.examples = [...existingExamples, ...newExamples];
      }
    }

    // Merge description
    if (
      additionalData.description &&
      additionalData.description !== existingConcept.description
    ) {
      updates.description = `${existingConcept.description}\n\nAdditional: ${additionalData.description}`;
    }

    // Update createdFrom
    const createdFrom = [...(existingConcept.createdFrom || [])];
    if (!createdFrom.includes(courseId.toString())) {
      createdFrom.push(courseId.toString());
      updates.createdFrom = createdFrom;
    }

    // Apply updates
    if (Object.keys(updates).length > 1) {
      await this.updateConcept(targetConceptId, updates);
    }

    // Link to course
    await this.linkConceptToCourse(
      targetConceptId,
      courseId,
      extractedConcept.confidence,
      extractedConcept.sourceContent
    );
  }

  /**
   * Link extracted concept to existing concept
   * @param targetConceptId ID of the target concept
   * @param extractedConcept Extracted concept data
   * @param courseId Source course ID
   */
  async linkConceptFromSession(
    targetConceptId: string,
    extractedConcept: SessionExtractedConcept,
    courseId: number
  ): Promise<void> {
    const existingConcept = await this.getConcept(targetConceptId);
    if (!existingConcept) {
      throw new ConceptValidationError(
        `Target concept ${targetConceptId} not found`
      );
    }

    // Update createdFrom if not already included
    const createdFrom = [...(existingConcept.createdFrom || [])];
    if (!createdFrom.includes(courseId.toString())) {
      createdFrom.push(courseId.toString());
      await this.updateConcept(targetConceptId, {
        createdFrom,
        lastUpdated: new Date(),
      });
    }

    // Link to course
    await this.linkConceptToCourse(
      targetConceptId,
      courseId,
      extractedConcept.confidence,
      extractedConcept.sourceContent
    );
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
