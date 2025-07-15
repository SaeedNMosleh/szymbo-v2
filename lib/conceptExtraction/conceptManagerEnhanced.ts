// lib/conceptExtraction/conceptManagerEnhanced.ts - Enhanced Concept Management Hub
import { ConceptManager } from "./conceptManager";
import Concept, { IConcept, IVocabularyData } from "@/datamodels/concept.model";
import ConceptGroup, { IConceptGroup } from "@/datamodels/conceptGroup.model";
import ConceptRelationship, { IConceptRelationship, RelationshipType } from "@/datamodels/conceptRelationship.model";
import CourseConcept from "@/datamodels/courseConcept.model";
import { ConceptLLMService } from "./conceptLLM";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";
import { SRSCalculator } from "@/lib/practiceEngine/srsCalculator";
import { v4 as uuidv4 } from "uuid";

/**
 * Enhanced ConceptManager with advanced operations for the Concept Management Hub
 * Extends the base ConceptManager with merge, split, archive, and relationship management
 */
export class ConceptManagerEnhanced extends ConceptManager {
  
  /**
   * Merge multiple concepts into a single concept
   * Preserves relationships and course linkages from all source concepts
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
      mergedFromIds: preserveHistory ? sourceConceptIds : [],
      version: 1,
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

    // Transfer concept relationships
    await this.transferRelationships(sourceConceptIds, mergedConcept.id);

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
        parentConceptId: sourceConceptId,
        
        // Inherit base properties if not specified
        category: subconceptData.category || sourceConcept.category,
        difficulty: subconceptData.difficulty || sourceConcept.difficulty,
        createdFrom: subconceptData.createdFrom || sourceConcept.createdFrom,
        tags: [
          ...(subconceptData.tags || []),
          ...(sourceConcept.tags || []),
          'split-concept'
        ],
        sourceType: 'manual',
        version: 1,
        lastUpdated: new Date(),
      };

      const subconcept = await this.createConcept(subconceptWithInheritance);
      createdSubconcepts.push(subconcept);

      // Create parent-child relationship
      await this.createConceptRelationship({
        fromConceptId: sourceConceptId,
        toConceptId: subconcept.id,
        relationshipType: 'parent-child',
        strength: 1.0,
        createdBy: 'system',
        bidirectional: false,
        description: `Split from parent concept: ${sourceConcept.name}`,
      });
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
      isArchived: true,
      archivedDate: new Date(),
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
    if (!concept || !concept.isArchived) {
      throw new Error("Concept not found or not archived");
    }

    const updates: Partial<IConcept> = {
      isArchived: false,
      archivedDate: undefined,
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
   * Create a relationship between two concepts
   * @param relationshipData Data for the relationship
   * @returns Created relationship
   */
  async createConceptRelationship(
    relationshipData: Partial<IConceptRelationship>
  ): Promise<IConceptRelationship> {
    if (!relationshipData.fromConceptId || !relationshipData.toConceptId) {
      throw new Error("Both fromConceptId and toConceptId are required");
    }

    // Validate concepts exist
    const [fromConcept, toConcept] = await Promise.all([
      this.getConcept(relationshipData.fromConceptId),
      this.getConcept(relationshipData.toConceptId)
    ]);

    if (!fromConcept || !toConcept) {
      throw new Error("One or both concepts not found");
    }

    const relationship: IConceptRelationship = {
      id: relationshipData.id || uuidv4(),
      fromConceptId: relationshipData.fromConceptId,
      toConceptId: relationshipData.toConceptId,
      relationshipType: relationshipData.relationshipType || 'related',
      strength: relationshipData.strength || 0.5,
      createdBy: relationshipData.createdBy || 'user',
      description: relationshipData.description,
      evidence: relationshipData.evidence || [],
      bidirectional: relationshipData.bidirectional || false,
      isActive: true,
      isVerified: relationshipData.createdBy === 'user',
      createdDate: new Date(),
      lastUpdated: new Date(),
    };

    const relationshipModel = new ConceptRelationship(relationship);
    const savedRelationship = await relationshipModel.save();

    // Create reverse relationship if bidirectional
    if (relationship.bidirectional) {
      const reverseRelationship: IConceptRelationship = {
        ...relationship,
        id: uuidv4(),
        fromConceptId: relationship.toConceptId,
        toConceptId: relationship.fromConceptId,
        description: relationship.description ? `Reverse: ${relationship.description}` : undefined,
      };

      const reverseModel = new ConceptRelationship(reverseRelationship);
      await reverseModel.save();
    }

    return savedRelationship.toObject();
  }

  /**
   * Get all relationships for a concept
   * @param conceptId Concept ID
   * @param includeIncoming Include relationships where this concept is the target
   * @returns Array of relationships
   */
  async getConceptRelationships(
    conceptId: string,
    includeIncoming: boolean = true
  ): Promise<IConceptRelationship[]> {
    const query = {
      $or: [
        { fromConceptId: conceptId },
        ...(includeIncoming ? [{ toConceptId: conceptId }] : [])
      ],
      isActive: true
    };

    const relationships = await ConceptRelationship.find(query);
    return relationships.map(rel => rel.toObject());
  }

  /**
   * Transfer relationships from source concepts to target concept
   * @param sourceConceptIds Source concept IDs
   * @param targetConceptId Target concept ID
   */
  private async transferRelationships(
    sourceConceptIds: string[],
    targetConceptId: string
  ): Promise<void> {
    for (const sourceId of sourceConceptIds) {
      const relationships = await this.getConceptRelationships(sourceId, true);

      for (const rel of relationships) {
        try {
          // Create new relationship with target concept
          const newRelationship: Partial<IConceptRelationship> = {
            fromConceptId: rel.fromConceptId === sourceId ? targetConceptId : rel.fromConceptId,
            toConceptId: rel.toConceptId === sourceId ? targetConceptId : rel.toConceptId,
            relationshipType: rel.relationshipType,
            strength: rel.strength * 0.9, // Slightly reduce strength for transferred relationships
            createdBy: 'system',
            description: `Transferred from merged concept: ${sourceId}`,
            bidirectional: rel.bidirectional,
          };

          // Avoid creating self-referencing relationships
          if (newRelationship.fromConceptId !== newRelationship.toConceptId) {
            await this.createConceptRelationship(newRelationship);
          }
        } catch (error) {
          console.warn(`Failed to transfer relationship:`, error);
        }
      }

      // Deactivate old relationships
      await ConceptRelationship.updateMany(
        {
          $or: [
            { fromConceptId: sourceId },
            { toConceptId: sourceId }
          ]
        },
        { $set: { isActive: false } }
      );
    }
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

    const group: IConceptGroup = {
      id: groupData.id || uuidv4(),
      name: groupData.name,
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