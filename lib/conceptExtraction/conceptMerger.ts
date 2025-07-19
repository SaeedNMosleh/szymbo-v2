/**
 * Concept Merger Service
 * 
 * Provides reusable functionality for merging similar concepts.
 * This service can be used in both concept review and concept management hub.
 */

import Concept, { IConcept } from "@/datamodels/concept.model";
import CourseConcept from "@/datamodels/courseConcept.model";
import ConceptProgress from "@/datamodels/conceptProgress.model";
import { ExtractedConcept } from "@/datamodels/conceptExtractionSession.model";
import { ConceptCategory } from "@/lib/enum";
import { logger, createOperationLogger } from "@/lib/utils/logger";

export interface MergeConceptData {
  targetConceptId: string;
  sourceConceptId?: string; // For merging existing concepts
  sourceConceptIds?: string[]; // For merging multiple existing concepts
  extractedConcept?: ExtractedConcept; // For merging extracted concepts
  finalConceptData?: Partial<IConcept>; // For concept management hub merges
  additionalData?: {
    examples?: string[];
    description?: string;
    tags?: string[];
  };
  courseId?: number;
}

export interface MergeResult {
  success: boolean;
  mergedConcept: IConcept | null;
  message: string;
  errors?: string[];
}

export class ConceptMerger {
  private logger = createOperationLogger('concept-merger');

  /**
   * Merge an extracted concept into an existing concept
   * @param mergeData Data for the merge operation
   * @returns Result of the merge operation
   */
  async mergeExtractedConcept(mergeData: MergeConceptData): Promise<MergeResult> {
    this.logger.info('Starting extracted concept merge', {
      targetConceptId: mergeData.targetConceptId,
      hasExtractedConcept: !!mergeData.extractedConcept,
      courseId: mergeData.courseId
    });

    try {
      // Validate inputs
      if (!mergeData.targetConceptId) {
        return {
          success: false,
          mergedConcept: null,
          message: "Target concept ID is required"
        };
      }

      if (!mergeData.extractedConcept) {
        return {
          success: false,
          mergedConcept: null,
          message: "Extracted concept data is required"
        };
      }

      // Get the target concept
      const targetConcept = await Concept.findOne({ 
        id: mergeData.targetConceptId,
        isActive: true 
      });

      if (!targetConcept) {
        return {
          success: false,
          mergedConcept: null,
          message: `Target concept with ID ${mergeData.targetConceptId} not found`
        };
      }

      this.logger.debug('Found target concept', {
        targetId: targetConcept.id,
        targetName: targetConcept.name,
        targetCategory: targetConcept.category
      });

      // Prepare merge updates
      const updates = await this.prepareMergeUpdates(
        targetConcept.toObject(),
        mergeData.extractedConcept,
        mergeData.additionalData
      );

      // Apply updates to the target concept
      const updatedConcept = await Concept.findOneAndUpdate(
        { id: mergeData.targetConceptId },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!updatedConcept) {
        return {
          success: false,
          mergedConcept: null,
          message: "Failed to update target concept"
        };
      }

      // Create course link if courseId is provided
      if (mergeData.courseId) {
        await this.createOrUpdateCourseLink(
          mergeData.targetConceptId,
          mergeData.courseId,
          mergeData.extractedConcept.confidence,
          mergeData.extractedConcept.sourceContent
        );
      }

      this.logger.success('Extracted concept merged successfully', {
        targetId: mergeData.targetConceptId,
        updatedFields: Object.keys(updates)
      });

      return {
        success: true,
        mergedConcept: updatedConcept.toObject(),
        message: `Successfully merged "${mergeData.extractedConcept.name}" into "${updatedConcept.name}"`
      };

    } catch (error) {
      this.logger.error('Error merging extracted concept', error as Error);
      return {
        success: false,
        mergedConcept: null,
        message: `Failed to merge concept: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Merge multiple existing concepts from concept management hub
   * @param mergeData Data for the merge operation
   * @returns Result of the merge operation
   */
  async mergeMultipleExistingConcepts(mergeData: MergeConceptData): Promise<MergeResult> {
    this.logger.info('Starting multiple concepts merge', {
      targetConceptId: mergeData.targetConceptId,
      sourceConceptIds: mergeData.sourceConceptIds,
      sourceCount: mergeData.sourceConceptIds?.length || 0
    });

    try {
      // Validate inputs
      if (!mergeData.targetConceptId || !mergeData.sourceConceptIds || mergeData.sourceConceptIds.length === 0) {
        return {
          success: false,
          mergedConcept: null,
          message: "Target concept ID and source concept IDs are required"
        };
      }

      // Get all concepts (target + sources)
      const allConceptIds = [mergeData.targetConceptId, ...mergeData.sourceConceptIds];
      const concepts = await Concept.find({ 
        id: { $in: allConceptIds },
        isActive: true 
      });

      if (concepts.length !== allConceptIds.length) {
        const foundIds = concepts.map(c => c.id);
        const missingIds = allConceptIds.filter(id => !foundIds.includes(id));
        return {
          success: false,
          mergedConcept: null,
          message: `Concepts not found: ${missingIds.join(', ')}`
        };
      }

      const targetConcept = concepts.find(c => c.id === mergeData.targetConceptId);
      const sourceConcepts = concepts.filter(c => mergeData.sourceConceptIds!.includes(c.id));

      if (!targetConcept) {
        return {
          success: false,
          mergedConcept: null,
          message: `Target concept with ID ${mergeData.targetConceptId} not found`
        };
      }

      this.logger.debug('Found concepts for multiple merge', {
        targetName: targetConcept.name,
        sourceNames: sourceConcepts.map(c => c.name),
        sourceCount: sourceConcepts.length
      });

      // Prepare merge updates from multiple sources
      const updates = await this.prepareMergeUpdatesFromMultipleConcepts(
        targetConcept.toObject(),
        sourceConcepts.map(c => c.toObject()),
        mergeData.finalConceptData,
        mergeData.additionalData
      );

      // Apply updates to target concept
      const updatedConcept = await Concept.findOneAndUpdate(
        { id: mergeData.targetConceptId },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!updatedConcept) {
        return {
          success: false,
          mergedConcept: null,
          message: "Failed to update target concept"
        };
      }

      // Transfer course links from all source concepts to target
      for (const sourceId of mergeData.sourceConceptIds) {
        await this.transferCourseLinks(sourceId, mergeData.targetConceptId);
        await this.transferProgressData(sourceId, mergeData.targetConceptId);
      }

      // Deactivate all source concepts
      await Concept.updateMany(
        { id: { $in: mergeData.sourceConceptIds } },
        { 
          $set: { 
            isActive: false,
            lastUpdated: new Date(),
            mergedInto: mergeData.targetConceptId
          }
        }
      );

      this.logger.success('Multiple concepts merged successfully', {
        targetId: mergeData.targetConceptId,
        sourceIds: mergeData.sourceConceptIds,
        mergedConceptName: updatedConcept.name
      });

      return {
        success: true,
        mergedConcept: updatedConcept.toObject(),
        message: `Successfully merged ${sourceConcepts.length} concepts into "${updatedConcept.name}"`
      };

    } catch (error) {
      this.logger.error('Error merging multiple concepts', error as Error);
      return {
        success: false,
        mergedConcept: null,
        message: `Failed to merge concepts: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Merge two existing concepts (original method)
   * @param mergeData Data for the merge operation
   * @returns Result of the merge operation
   */
  async mergeExistingConcepts(mergeData: MergeConceptData): Promise<MergeResult> {
    this.logger.info('Starting existing concepts merge', {
      targetConceptId: mergeData.targetConceptId,
      sourceConceptId: mergeData.sourceConceptId
    });

    try {
      // Validate inputs
      if (!mergeData.targetConceptId || !mergeData.sourceConceptId) {
        return {
          success: false,
          mergedConcept: null,
          message: "Both target and source concept IDs are required"
        };
      }

      if (mergeData.targetConceptId === mergeData.sourceConceptId) {
        return {
          success: false,
          mergedConcept: null,
          message: "Cannot merge a concept with itself"
        };
      }

      // Get both concepts
      const [targetConcept, sourceConcept] = await Promise.all([
        Concept.findOne({ id: mergeData.targetConceptId, isActive: true }),
        Concept.findOne({ id: mergeData.sourceConceptId, isActive: true })
      ]);

      if (!targetConcept || !sourceConcept) {
        return {
          success: false,
          mergedConcept: null,
          message: "One or both concepts not found"
        };
      }

      this.logger.debug('Found concepts for merge', {
        targetName: targetConcept.name,
        sourceName: sourceConcept.name
      });

      // Prepare merge updates
      const updates = await this.prepareMergeUpdatesFromConcepts(
        targetConcept.toObject(),
        sourceConcept.toObject(),
        mergeData.additionalData
      );

      // Apply updates to target concept
      const updatedConcept = await Concept.findOneAndUpdate(
        { id: mergeData.targetConceptId },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!updatedConcept) {
        return {
          success: false,
          mergedConcept: null,
          message: "Failed to update target concept"
        };
      }

      // Transfer course links from source to target
      await this.transferCourseLinks(mergeData.sourceConceptId, mergeData.targetConceptId);

      // Transfer progress data from source to target
      await this.transferProgressData(mergeData.sourceConceptId, mergeData.targetConceptId);

      // Deactivate the source concept
      await Concept.findOneAndUpdate(
        { id: mergeData.sourceConceptId },
        { 
          $set: { 
            isActive: false,
            lastUpdated: new Date(),
            mergedInto: mergeData.targetConceptId
          }
        }
      );

      this.logger.success('Existing concepts merged successfully', {
        targetId: mergeData.targetConceptId,
        sourceId: mergeData.sourceConceptId
      });

      return {
        success: true,
        mergedConcept: updatedConcept.toObject(),
        message: `Successfully merged "${sourceConcept.name}" into "${updatedConcept.name}"`
      };

    } catch (error) {
      this.logger.error('Error merging existing concepts', error as Error);
      return {
        success: false,
        mergedConcept: null,
        message: `Failed to merge concepts: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Prepare merge updates for extracted concept
   */
  private async prepareMergeUpdates(
    targetConcept: IConcept,
    extractedConcept: ExtractedConcept,
    additionalData?: {
      examples?: string[];
      description?: string;
      tags?: string[];
    }
  ): Promise<Partial<IConcept>> {
    const updates: Partial<IConcept> = {
      lastUpdated: new Date()
    };

    // Merge examples
    const existingExamples = targetConcept.examples || [];
    const newExamples = [
      ...(extractedConcept.examples || []),
      ...(additionalData?.examples || [])
    ];
    
    const uniqueExamples = Array.from(new Set([
      ...existingExamples,
      ...newExamples.filter(example => example.trim() !== '')
    ]));

    if (uniqueExamples.length > existingExamples.length) {
      updates.examples = uniqueExamples;
    }

    // Merge description if provided
    if (additionalData?.description && additionalData.description !== targetConcept.description) {
      const combinedDescription = [
        targetConcept.description,
        additionalData.description
      ].filter(desc => desc && desc.trim() !== '').join('\n\nAdditional: ');
      
      updates.description = combinedDescription;
    }

    // Merge tags
    const existingTags = targetConcept.tags || [];
    const newTags = [
      ...(extractedConcept.suggestedTags?.map(tag => tag.tag) || []),
      ...(additionalData?.tags || [])
    ];
    
    const uniqueTags = Array.from(new Set([
      ...existingTags,
      ...newTags.filter(tag => tag.trim() !== '')
    ]));

    if (uniqueTags.length > existingTags.length) {
      updates.tags = uniqueTags;
    }

    // Update confidence if the extracted concept has higher confidence
    if (extractedConcept.confidence > targetConcept.confidence) {
      updates.confidence = extractedConcept.confidence;
    }

    return updates;
  }

  /**
   * Prepare merge updates for multiple existing concepts
   */
  private async prepareMergeUpdatesFromMultipleConcepts(
    targetConcept: IConcept,
    sourceConcepts: IConcept[],
    finalConceptData?: Partial<IConcept>,
    additionalData?: {
      examples?: string[];
      description?: string;
      tags?: string[];
    }
  ): Promise<Partial<IConcept>> {
    const updates: Partial<IConcept> = {
      lastUpdated: new Date()
    };

    // If finalConceptData is provided (from edit dialog), use it as the base
    if (finalConceptData) {
      Object.assign(updates, finalConceptData);
      return updates;
    }

    // Otherwise, merge all data automatically
    // Merge examples from all concepts
    const allExamples = [
      ...(targetConcept.examples || []),
      ...sourceConcepts.flatMap(c => c.examples || []),
      ...(additionalData?.examples || [])
    ];
    
    const uniqueExamples = Array.from(new Set(
      allExamples.filter(example => example.trim() !== '')
    ));

    updates.examples = uniqueExamples;

    // Merge descriptions from all concepts
    const allDescriptions = [
      targetConcept.description,
      ...sourceConcepts.map(c => c.description),
      additionalData?.description
    ].filter(desc => desc && desc.trim() !== '');

    if (allDescriptions.length > 1) {
      updates.description = `${allDescriptions[0]}\n\nMerged from:\n${allDescriptions.slice(1).map(desc => `• ${desc}`).join('\n')}`;
    } else if (allDescriptions.length === 1) {
      updates.description = allDescriptions[0];
    }

    // Merge tags from all concepts
    const allTags = [
      ...(targetConcept.tags || []),
      ...sourceConcepts.flatMap(c => c.tags || []),
      ...(additionalData?.tags || [])
    ];
    
    const uniqueTags = Array.from(new Set(
      allTags.filter(tag => tag.trim() !== '')
    ));

    updates.tags = uniqueTags;

    // Take the highest confidence from all concepts
    const allConfidences = [
      targetConcept.confidence,
      ...sourceConcepts.map(c => c.confidence)
    ].filter(conf => typeof conf === 'number');

    if (allConfidences.length > 0) {
      updates.confidence = Math.max(...allConfidences);
    }

    // Merge createdFrom arrays from all concepts
    const allCreatedFrom = [
      ...(targetConcept.createdFrom || []),
      ...sourceConcepts.flatMap(c => c.createdFrom || [])
    ];
    
    updates.createdFrom = Array.from(new Set(allCreatedFrom));

    return updates;
  }

  /**
   * Prepare merge updates for existing concepts (original method)
   */
  private async prepareMergeUpdatesFromConcepts(
    targetConcept: IConcept,
    sourceConcept: IConcept,
    additionalData?: {
      examples?: string[];
      description?: string;
      tags?: string[];
    }
  ): Promise<Partial<IConcept>> {
    const updates: Partial<IConcept> = {
      lastUpdated: new Date()
    };

    // Merge examples
    const allExamples = [
      ...(targetConcept.examples || []),
      ...(sourceConcept.examples || []),
      ...(additionalData?.examples || [])
    ];
    
    const uniqueExamples = Array.from(new Set(
      allExamples.filter(example => example.trim() !== '')
    ));

    updates.examples = uniqueExamples;

    // Merge descriptions
    const descriptions = [
      targetConcept.description,
      sourceConcept.description,
      additionalData?.description
    ].filter(desc => desc && desc.trim() !== '');

    if (descriptions.length > 1) {
      updates.description = descriptions.join('\n\nMerged: ');
    }

    // Merge tags
    const allTags = [
      ...(targetConcept.tags || []),
      ...(sourceConcept.tags || []),
      ...(additionalData?.tags || [])
    ];
    
    const uniqueTags = Array.from(new Set(
      allTags.filter(tag => tag.trim() !== '')
    ));

    updates.tags = uniqueTags;

    // Take the higher confidence
    if (sourceConcept.confidence > targetConcept.confidence) {
      updates.confidence = sourceConcept.confidence;
    }

    // Merge createdFrom arrays
    const allCreatedFrom = [
      ...(targetConcept.createdFrom || []),
      ...(sourceConcept.createdFrom || [])
    ];
    
    updates.createdFrom = Array.from(new Set(allCreatedFrom));

    return updates;
  }

  /**
   * Create or update course link
   */
  private async createOrUpdateCourseLink(
    conceptId: string,
    courseId: number,
    confidence: number,
    sourceContent: string
  ): Promise<void> {
    try {
      await CourseConcept.findOneAndUpdate(
        { conceptId, courseId },
        {
          $set: {
            confidence,
            sourceContent,
            isActive: true,
            extractedDate: new Date()
          }
        },
        { upsert: true }
      );

      this.logger.debug('Course link created/updated', { conceptId, courseId });
    } catch (error) {
      this.logger.error('Error creating course link', error as Error);
    }
  }

  /**
   * Transfer course links from source to target concept
   */
  private async transferCourseLinks(sourceConceptId: string, targetConceptId: string): Promise<void> {
    try {
      // Get all course links for source concept
      const sourceLinks = await CourseConcept.find({ 
        conceptId: sourceConceptId,
        isActive: true 
      });

      // Create corresponding links for target concept
      for (const link of sourceLinks) {
        await CourseConcept.findOneAndUpdate(
          { 
            conceptId: targetConceptId, 
            courseId: link.courseId 
          },
          {
            $set: {
              confidence: Math.max(link.confidence, 0.8), // Ensure good confidence for merged concept
              sourceContent: `Merged from ${sourceConceptId}: ${link.sourceContent}`,
              isActive: true,
              extractedDate: new Date()
            }
          },
          { upsert: true }
        );
      }

      // Deactivate source links
      await CourseConcept.updateMany(
        { conceptId: sourceConceptId },
        { $set: { isActive: false } }
      );

      this.logger.debug('Course links transferred', { 
        sourceConceptId, 
        targetConceptId, 
        linkCount: sourceLinks.length 
      });
    } catch (error) {
      this.logger.error('Error transferring course links', error as Error);
    }
  }

  /**
   * Transfer progress data from source to target concept
   */
  private async transferProgressData(sourceConceptId: string, targetConceptId: string): Promise<void> {
    try {
      // Get all progress records for source concept
      const sourceProgress = await ConceptProgress.find({ conceptId: sourceConceptId });

      for (const progress of sourceProgress) {
        // Check if target already has progress for this user
        const existingProgress = await ConceptProgress.findOne({
          conceptId: targetConceptId,
          userId: progress.userId
        });

        if (existingProgress) {
          // Merge progress data - take the better performance
          const updates = {
            totalAttempts: existingProgress.totalAttempts + progress.totalAttempts,
            correctAttempts: existingProgress.correctAttempts + progress.correctAttempts,
            streak: Math.max(existingProgress.streak, progress.streak),
            lastReviewed: progress.lastReviewed > existingProgress.lastReviewed 
              ? progress.lastReviewed 
              : existingProgress.lastReviewed,
            // Keep the more favorable scheduling
            nextReview: progress.nextReview < existingProgress.nextReview 
              ? progress.nextReview 
              : existingProgress.nextReview,
            difficulty: Math.min(existingProgress.difficulty, progress.difficulty),
            interval: Math.max(existingProgress.interval, progress.interval)
          };

          await ConceptProgress.findOneAndUpdate(
            { conceptId: targetConceptId, userId: progress.userId },
            { $set: updates }
          );
        } else {
          // Create new progress record for target concept
          const newProgress = {
            ...progress.toObject(),
            conceptId: targetConceptId,
            _id: undefined
          };
          
          await ConceptProgress.create(newProgress);
        }
      }

      // Remove source progress records
      await ConceptProgress.deleteMany({ conceptId: sourceConceptId });

      this.logger.debug('Progress data transferred', { 
        sourceConceptId, 
        targetConceptId, 
        progressCount: sourceProgress.length 
      });
    } catch (error) {
      this.logger.error('Error transferring progress data', error as Error);
    }
  }

  /**
   * Preview merge operation without executing it
   */
  async previewMerge(mergeData: MergeConceptData): Promise<{
    targetConcept: IConcept | null;
    sourceConcept?: IConcept | null;
    extractedConcept?: ExtractedConcept;
    previewUpdates: {
      examples: string[];
      tags: string[];
      description: string;
      affectedCourses: number[];
      affectedUsers: string[];
    };
  }> {
    try {
      const targetConcept = await Concept.findOne({ 
        id: mergeData.targetConceptId,
        isActive: true 
      });

      if (!targetConcept) {
        return {
          targetConcept: null,
          previewUpdates: {
            examples: [],
            tags: [],
            description: '',
            affectedCourses: [],
            affectedUsers: []
          }
        };
      }

      let sourceConcept: IConcept | null = null;
      if (mergeData.sourceConceptId) {
        sourceConcept = await Concept.findOne({ 
          id: mergeData.sourceConceptId,
          isActive: true 
        })?.toObject() || null;
      }

      // Calculate preview updates
      const previewUpdates = mergeData.extractedConcept
        ? await this.prepareMergeUpdates(
            targetConcept.toObject(),
            mergeData.extractedConcept,
            mergeData.additionalData
          )
        : sourceConcept
        ? await this.prepareMergeUpdatesFromConcepts(
            targetConcept.toObject(),
            sourceConcept,
            mergeData.additionalData
          )
        : {};

      // Get affected courses and users
      const [courseLinks, progressRecords] = await Promise.all([
        CourseConcept.find({ 
          conceptId: { $in: [mergeData.targetConceptId, mergeData.sourceConceptId].filter(Boolean) },
          isActive: true 
        }),
        ConceptProgress.find({ 
          conceptId: { $in: [mergeData.targetConceptId, mergeData.sourceConceptId].filter(Boolean) }
        })
      ]);

      return {
        targetConcept: targetConcept.toObject(),
        sourceConcept,
        extractedConcept: mergeData.extractedConcept,
        previewUpdates: {
          examples: previewUpdates.examples || targetConcept.examples || [],
          tags: previewUpdates.tags || targetConcept.tags || [],
          description: previewUpdates.description || targetConcept.description || '',
          affectedCourses: Array.from(new Set(courseLinks.map(link => link.courseId))),
          affectedUsers: Array.from(new Set(progressRecords.map(progress => progress.userId)))
        }
      };
    } catch (error) {
      this.logger.error('Error generating merge preview', error as Error);
      throw error;
    }
  }
}

/**
 * Factory function for creating concept merger
 */
export function createConceptMerger(): ConceptMerger {
  return new ConceptMerger();
}

/**
 * Singleton instance for reuse across the application
 */
export const conceptMerger = new ConceptMerger();