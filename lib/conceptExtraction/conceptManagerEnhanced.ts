// lib/conceptExtraction/conceptManagerEnhanced.ts - Enhanced Concept Management Hub
import { ConceptManager } from "./conceptManager";
import { IConcept } from "@/datamodels/concept.model";
import ConceptGroup, { IConceptGroup } from "@/datamodels/conceptGroup.model";
import CourseConcept from "@/datamodels/courseConcept.model";
import { ConceptLLMService } from "./conceptLLM";
import { QuestionLevel } from "@/lib/enum";
import { v4 as uuidv4 } from "uuid";

/**
 * Enhanced ConceptManager with advanced operations for the Concept Management Hub
 * Extends the base ConceptManager with merge, split, archive, and group management
 */
export class ConceptManagerEnhanced extends ConceptManager {
  
  /**
   * Merge multiple concepts into a single concept
   * Preserves course linkages and tags from all source concepts
   * @param sourceConceptIds Array of concept IDs to merge
   * @param targetConceptData Data for the merged concept
   * @param preserveHistory Whether to keep merge history
   * @returns The merged concept
   */
  async mergeConcepts(
    sourceConceptIds: string[],
    targetConceptData: Partial<IConcept>,
    preserveHistory: boolean = true
  ): Promise<IConcept> {
    if (sourceConceptIds.length < 2) {
      throw new Error("At least 2 concepts required for merging");
    }

    // Fetch all source concepts
    const sourceConcepts = await Promise.all(
      sourceConceptIds.map(id => this.getConcept(id))
    );

    // Validate all concepts exist
    const missingConcepts = sourceConcepts.filter(c => !c);
    if (missingConcepts.length > 0) {
      throw new Error("Some source concepts not found");
    }

    const validSourceConcepts = sourceConcepts.filter(c => c !== null) as IConcept[];

    // Aggregate data from source concepts
    const mergedData: Partial<IConcept> = {
      ...targetConceptData,
      id: targetConceptData.id || uuidv4(),
      
      // Merge examples (remove duplicates)
      examples: [
        ...(targetConceptData.examples || []),
        ...Array.from(new Set(
          validSourceConcepts.flatMap(c => c.examples || [])
        ))
      ],
      
      // Merge tags
      tags: [
        ...(targetConceptData.tags || []),
        ...Array.from(new Set(
          validSourceConcepts.flatMap(c => c.tags || [])
        ))
      ],
      
      // Merge createdFrom
      createdFrom: [
        ...(targetConceptData.createdFrom || []),
        ...Array.from(new Set(
          validSourceConcepts.flatMap(c => c.createdFrom || [])
        ))
      ],
      
      // Track merge history
      // mergedFromIds: preserveHistory ? sourceConceptIds : [],
      // version: 1,
      sourceType: targetConceptData.sourceType || 'manual',
      lastUpdated: new Date(),
    };

    // Create the merged concept
    const mergedConcept = await this.createConcept(mergedData);

    // Transfer all course linkages from source concepts
    for (const sourceConcept of validSourceConcepts) {
      const courseIds = await this.getCoursesForConcept(sourceConcept.id);
      
      for (const courseId of courseIds) {
        try {
          await this.linkConceptToCourse(
            mergedConcept.id,
            courseId,
            0.9, // High confidence for merged concepts
            `Merged from concept: ${sourceConcept.name}`
          );
        } catch (error) {
          console.warn(`Failed to link merged concept to course ${courseId}:`, error);
        }
      }
    }

    // Archive source concepts instead of deleting
    for (const conceptId of sourceConceptIds) {
      await this.archiveConcept(conceptId, `Merged into concept: ${mergedConcept.name}`);
    }

    return mergedConcept;
  }

  /**
   * Split a concept into multiple subconcepts
   * @param sourceConceptId Concept to split
   * @param subconceptsData Array of data for new subconcepts
   * @param preserveOriginal Whether to keep the original concept
   * @returns Array of created subconcepts
   */
  async splitConcept(
    sourceConceptId: string,
    subconceptsData: Partial<IConcept>[],
    preserveOriginal: boolean = false
  ): Promise<IConcept[]> {
    if (subconceptsData.length < 2) {
      throw new Error("At least 2 subconcepts required for splitting");
    }

    const sourceConcept = await this.getConcept(sourceConceptId);
    if (!sourceConcept) {
      throw new Error(`Source concept ${sourceConceptId} not found`);
    }

    const createdSubconcepts: IConcept[] = [];

    // Create each subconcept
    for (const subconceptData of subconceptsData) {
      const subconceptWithInheritance: Partial<IConcept> = {
        ...subconceptData,
        id: subconceptData.id || uuidv4(),
        
        // Inherit base properties if not specified
        category: subconceptData.category || sourceConcept.category,
        difficulty: subconceptData.difficulty || sourceConcept.difficulty,
        createdFrom: subconceptData.createdFrom || sourceConcept.createdFrom,
        tags: [
          ...(subconceptData.tags || []),
          ...(sourceConcept.tags || []),
          'split-concept',
          `split-from-${sourceConcept.name.toLowerCase().replace(/\s+/g, '-')}`
        ],
        sourceType: 'manual',
        // version: 1,
        lastUpdated: new Date(),
      };

      const subconcept = await this.createConcept(subconceptWithInheritance);
      createdSubconcepts.push(subconcept);
    }

    // Archive original concept if not preserving
    if (!preserveOriginal) {
      await this.archiveConcept(
        sourceConceptId, 
        `Split into subconcepts: ${createdSubconcepts.map(c => c.name).join(', ')}`
      );
    }

    return createdSubconcepts;
  }

  /**
   * Archive a concept (soft delete)
   * @param conceptId Concept to archive
   * @param reason Reason for archiving
   */
  async archiveConcept(conceptId: string, reason?: string): Promise<void> {
    const updates: Partial<IConcept> = {
      isActive: false,
      lastUpdated: new Date(),
    };

    if (reason) {
      const concept = await this.getConcept(conceptId);
      updates.tags = [...(concept?.tags || []), `archived:${reason}`];
    }

    await this.updateConcept(conceptId, updates);

    // Deactivate course linkages
    await CourseConcept.updateMany(
      { conceptId },
      { $set: { isActive: false } }
    );
  }

  /**
   * Restore an archived concept
   * @param conceptId Concept to restore
   */
  async restoreConcept(conceptId: string): Promise<void> {
    const concept = await this.getConcept(conceptId);
    if (!concept || concept.isActive) {
      throw new Error("Concept not found or not archived");
    }

    const updates: Partial<IConcept> = {
      isActive: true,
      lastUpdated: new Date(),
    };

    // Remove archive tags
    if (concept.tags) {
      updates.tags = concept.tags.filter(tag => !tag.startsWith('archived:'));
    }

    await this.updateConcept(conceptId, updates);

    // Reactivate course linkages
    await CourseConcept.updateMany(
      { conceptId },
      { $set: { isActive: true } }
    );
  }


  /**
   * Create a concept group following the hierarchical structure
   * @param groupData Data for the concept group
   * @returns Created concept group
   */
  async createConceptGroup(groupData: Partial<IConceptGroup>): Promise<IConceptGroup> {
    if (!groupData.name || !groupData.groupType) {
      throw new Error("Name and groupType are required for concept groups");
    }

    // Check if a group with the same name and groupType already exists
    let uniqueName = groupData.name;
    let counter = 1;
    
    while (true) {
      const existingGroup = await ConceptGroup.findOne({ 
        name: uniqueName, 
        groupType: groupData.groupType,
        isActive: true 
      });
      
      if (!existingGroup) {
        break; // Name is unique, we can use it
      }
      
      // Generate a new name with counter
      counter++;
      uniqueName = `${groupData.name} (${counter})`;
    }

    const group: IConceptGroup = {
      id: groupData.id || uuidv4(),
      name: uniqueName,
      description: groupData.description || '',
      memberConcepts: groupData.memberConcepts || [],
      parentGroup: groupData.parentGroup,
      childGroups: groupData.childGroups || [],
      groupType: groupData.groupType,
      level: groupData.level || 1,
      difficulty: groupData.difficulty || QuestionLevel.A1,
      isActive: true,
      createdDate: new Date(),
      lastUpdated: new Date(),
    };

    const groupModel = new ConceptGroup(group);
    const savedGroup = await groupModel.save();

    // Update parent group if specified
    if (group.parentGroup) {
      await ConceptGroup.findOneAndUpdate(
        { id: group.parentGroup },
        { $addToSet: { childGroups: group.id } }
      );
    }

    return savedGroup.toObject();
  }

  /**
   * Add concepts to a group
   * @param groupId Group ID
   * @param conceptIds Array of concept IDs to add
   */
  async addConceptsToGroup(groupId: string, conceptIds: string[]): Promise<void> {
    // Validate concepts exist
    const concepts = await Promise.all(
      conceptIds.map(id => this.getConcept(id))
    );

    const validConceptIds = concepts
      .filter(c => c !== null)
      .map(c => c!.id);

    if (validConceptIds.length === 0) {
      throw new Error("No valid concepts found");
    }

    await ConceptGroup.findOneAndUpdate(
      { id: groupId },
      { 
        $addToSet: { memberConcepts: { $each: validConceptIds } },
        $set: { lastUpdated: new Date() }
      }
    );
  }

  /**
   * Get concepts in a group with optional cascading to child groups
   * @param groupId Group ID
   * @param includeChildren Include concepts from child groups
   * @param maxDepth Maximum depth for cascading
   * @returns Array of concepts
   */
  async getConceptsInGroup(
    groupId: string,
    includeChildren: boolean = false,
    maxDepth: number = 5
  ): Promise<IConcept[]> {
    const group = await ConceptGroup.findOne({ id: groupId, isActive: true });
    if (!group) {
      throw new Error(`Concept group ${groupId} not found`);
    }

    // eslint-disable-next-line prefer-const
    let allConceptIds = [...group.memberConcepts];

    // Recursively collect concepts from child groups
    if (includeChildren && maxDepth > 0) {
      for (const childGroupId of group.childGroups) {
        try {
          const childConcepts = await this.getConceptsInGroup(
            childGroupId,
            true,
            maxDepth - 1
          );
          allConceptIds.push(...childConcepts.map(c => c.id));
        } catch (error) {
          console.warn(`Failed to get concepts from child group ${childGroupId}:`, error);
        }
      }
    }

    // Remove duplicates and fetch concepts
    const uniqueConceptIds = Array.from(new Set(allConceptIds));
    const concepts = await Promise.all(
      uniqueConceptIds.map(id => this.getConcept(id))
    );

    return concepts.filter(c => c !== null) as IConcept[];
  }

  /**
   * Update a concept group
   * @param groupId Group ID
   * @param updates Partial updates to apply
   * @returns Updated group
   */
  async updateConceptGroup(
    groupId: string,
    updates: Partial<IConceptGroup>
  ): Promise<IConceptGroup> {
    const updatedGroup = await ConceptGroup.findOneAndUpdate(
      { id: groupId },
      { 
        $set: { 
          ...updates,
          lastUpdated: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedGroup) {
      throw new Error(`Concept group ${groupId} not found`);
    }

    return updatedGroup.toObject();
  }

  /**
   * Remove concepts from a group
   * @param groupId Group ID
   * @param conceptIds Array of concept IDs to remove
   */
  async removeConceptsFromGroup(groupId: string, conceptIds: string[]): Promise<void> {
    await ConceptGroup.findOneAndUpdate(
      { id: groupId },
      { 
        $pull: { memberConcepts: { $in: conceptIds } },
        $set: { lastUpdated: new Date() }
      }
    );
  }

  /**
   * Get all concept groups with optional filtering
   * @param filters Optional filters for groups
   * @returns Array of concept groups
   */
  async getConceptGroups(filters?: {
    groupType?: string;
    parentGroup?: string;
    isActive?: boolean;
    level?: number;
  }): Promise<IConceptGroup[]> {
    const query: any = {};

    if (filters?.groupType) {
      query.groupType = filters.groupType;
    }

    if (filters?.parentGroup) {
      query.parentGroup = filters.parentGroup;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters?.level) {
      query.level = filters.level;
    }

    const groups = await ConceptGroup.find(query)
      .sort({ level: 1, name: 1 })
      .lean();

    return groups as unknown as IConceptGroup[];
  }

  /**
   * Get a specific concept group
   * @param groupId Group ID
   * @returns Concept group or null if not found
   */
  async getConceptGroup(groupId: string): Promise<IConceptGroup | null> {
    const group = await ConceptGroup.findOne({ id: groupId, isActive: true }).lean();
    return group as IConceptGroup | null;
  }

  /**
   * Archive a concept group (soft delete)
   * @param groupId Group ID
   * @param reason Reason for archiving
   */
  async archiveConceptGroup(groupId: string, reason?: string): Promise<void> {
    await ConceptGroup.findOneAndUpdate(
      { id: groupId },
      { 
        $set: { 
          isActive: false,
          lastUpdated: new Date()
        }
      }
    );

    // Remove from parent group's childGroups if it has a parent
    const group = await ConceptGroup.findOne({ id: groupId });
    if (group?.parentGroup) {
      await ConceptGroup.findOneAndUpdate(
        { id: group.parentGroup },
        { 
          $pull: { childGroups: groupId },
          $set: { lastUpdated: new Date() }
        }
      );
    }
  }

  /**
   * Get group hierarchy for a specific group
   * @param groupId Root group ID
   * @param maxDepth Maximum depth to traverse
   * @returns Hierarchical group structure
   */
  async getGroupHierarchy(
    groupId: string,
    maxDepth: number = 5
  ): Promise<IConceptGroup & { children?: IConceptGroup[] }> {
    const rootGroup = await this.getConceptGroup(groupId);
    if (!rootGroup) {
      throw new Error(`Concept group ${groupId} not found`);
    }

    const enrichedGroup = rootGroup as IConceptGroup & { children?: IConceptGroup[] };

    // Recursively get children if depth allows
    if (maxDepth > 0 && rootGroup.childGroups.length > 0) {
      enrichedGroup.children = [];
      
      for (const childGroupId of rootGroup.childGroups) {
        try {
          const childGroup = await this.getGroupHierarchy(childGroupId, maxDepth - 1);
          enrichedGroup.children.push(childGroup);
        } catch (error) {
          console.warn(`Failed to get child group ${childGroupId}:`, error);
        }
      }
    }

    return enrichedGroup;
  }

  /**
   * Move concepts between groups
   * @param conceptIds Array of concept IDs to move
   * @param fromGroupId Source group ID
   * @param toGroupId Target group ID
   */
  async moveConceptsBetweenGroups(
    conceptIds: string[],
    fromGroupId: string,
    toGroupId: string
  ): Promise<void> {
    // Validate concepts exist
    const concepts = await Promise.all(
      conceptIds.map(id => this.getConcept(id))
    );

    const validConceptIds = concepts
      .filter(c => c !== null)
      .map(c => c!.id);

    if (validConceptIds.length === 0) {
      throw new Error("No valid concepts found");
    }

    // Remove from source group
    await this.removeConceptsFromGroup(fromGroupId, validConceptIds);

    // Add to target group
    await this.addConceptsToGroup(toGroupId, validConceptIds);
  }
}

/**
 * Factory function for creating enhanced concept manager
 * @param llmService Optional LLM service
 * @returns Enhanced concept manager instance
 */
export function createEnhancedConceptManager(
  llmService?: ConceptLLMService
): ConceptManagerEnhanced {
  return new ConceptManagerEnhanced(llmService);
}