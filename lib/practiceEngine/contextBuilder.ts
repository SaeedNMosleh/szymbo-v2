// lib/practiceEngine/contextBuilder.ts
// Using a single import to avoid circular dependency issues
import Concept from "@/datamodels/concept.model";
import { ConceptCategory } from "@/lib/enum";

export interface ConceptSummary {
  id: string;
  name: string;
  category: ConceptCategory;
  description?: string;
  keyExamples?: string[];
  difficulty?: string;
}

export interface SmartContext {
  targetConcepts: ConceptSummary[];
  contextConcepts: ConceptSummary[]; // Group-based and category-based context concepts
  sessionObjectives: string[];
  interleaving: boolean;
}

export class ContextBuilder {
  /**
   * Build minimal context for LLM question generation
   */
  async buildContextForConcepts(conceptIds: string[]): Promise<string> {
    if (conceptIds.length === 0) {
      return "General Polish language practice session.";
    }

    // Get target concepts
    const targetConcepts = await this.getConceptSummaries(conceptIds);

    // Get context concepts for richer context (group-based and category-based)
    const contextConcepts = await this.getContextConcepts(conceptIds);

    // Build smart context
    const smartContext: SmartContext = {
      targetConcepts,
      contextConcepts,
      sessionObjectives: this.generateSessionObjectives(targetConcepts),
      interleaving: targetConcepts.length > 1,
    };

    return this.formatContextForLLM(smartContext);
  }

  /**
   * Get lightweight concept summaries for efficient LLM usage
   */
  private async getConceptSummaries(
    conceptIds: string[]
  ): Promise<ConceptSummary[]> {
    const concepts = await Concept.find({
      id: { $in: conceptIds },
      isActive: true,
    });

    return concepts.map((concept) => ({
      id: concept.id,
      name: concept.name,
      category: concept.category,
      description: concept.description,
      keyExamples: concept.examples.slice(0, 3), // Limit examples for token efficiency
      difficulty: concept.difficulty,
    }));
  }

  /**
   * Get context concepts for cross-reinforcement (group-based and category-based)
   */
  async getContextConcepts(conceptIds: string[]): Promise<ConceptSummary[]> {
    const targetConcepts = await Concept.find({
      id: { $in: conceptIds },
      isActive: true,
    });

    if (targetConcepts.length === 0) return [];

    // Find concepts from same groups as target concepts
    const contextIds = new Set<string>();
    
    try {
      // Import ConceptGroup dynamically to avoid circular dependencies
      const { default: ConceptGroup } = await import("@/datamodels/conceptGroup.model");
      
      // Find groups containing target concepts
      const groups = await ConceptGroup.find({
        memberConcepts: { $in: conceptIds },
        isActive: true,
      }).lean();
      
      // Add other concepts from the same groups
      for (const group of groups) {
        for (const memberConceptId of group.memberConcepts) {
          if (!conceptIds.includes(memberConceptId)) {
            contextIds.add(memberConceptId);
          }
        }
      }
    } catch (error) {
      console.warn("Could not load group-based context concepts:", error);
    }

    // If no group context found, find concepts from same category
    if (contextIds.size === 0) {
      const categories = [...new Set(targetConcepts.map((c) => c.category))];
      const sameCategoryConcepts = await Concept.find({
        category: { $in: categories },
        id: { $nin: conceptIds },
        isActive: true,
      }).limit(3);

      sameCategoryConcepts.forEach((c) => contextIds.add(c.id));
    }

    // Get context concept details (limit to 3 for efficiency)
    const contextConceptIds = Array.from(contextIds).slice(0, 3);
    return await this.getConceptSummaries(contextConceptIds);
  }

  /**
   * Generate session learning objectives
   */
  private generateSessionObjectives(
    targetConcepts: ConceptSummary[]
  ): string[] {
    const objectives: string[] = [];

    if (targetConcepts.length === 0) {
      return ["Practice general Polish language skills"];
    }

    if (targetConcepts.length === 1) {
      const concept = targetConcepts[0];
      objectives.push(`Master ${concept.name} (${concept.category})`);
      objectives.push(`Apply ${concept.name} in context`);
    } else {
      // Multi-concept session
      const grammarConcepts = targetConcepts.filter(
        (c) => c.category === ConceptCategory.GRAMMAR
      );
      const vocabularyConcepts = targetConcepts.filter(
        (c) => c.category === ConceptCategory.VOCABULARY
      );

      if (grammarConcepts.length > 0 && vocabularyConcepts.length > 0) {
        objectives.push("Practice grammar and vocabulary together in context");
        objectives.push("Build fluency through concept integration");
      } else if (grammarConcepts.length > 1) {
        objectives.push("Master multiple grammar patterns");
        objectives.push("Apply grammatical concepts in varied contexts");
      } else if (vocabularyConcepts.length > 1) {
        objectives.push("Expand vocabulary across topics");
        objectives.push("Use new vocabulary in sentences");
      }

      // Add interleaving objective
      objectives.push("Practice concept switching and mental flexibility");
    }

    return objectives;
  }

  /**
   * Format context for LLM question generation
   */
  private formatContextForLLM(context: SmartContext): string {
    let formattedContext = "PRACTICE SESSION CONTEXT:\n\n";

    // Target concepts
    formattedContext += "TARGET CONCEPTS:\n";
    for (const concept of context.targetConcepts) {
      formattedContext += `• ${concept.name} (${concept.category}, ${concept.difficulty})\n`;
      formattedContext += `  Description: ${concept.description}\n`;
      if (concept.keyExamples && concept.keyExamples.length > 0) {
        formattedContext += `  Examples: ${concept.keyExamples.join(", ")}\n`;
      }
      formattedContext += "\n";
    }

    // Context concepts for reference
    if (context.contextConcepts.length > 0) {
      formattedContext += "CONTEXT CONCEPTS (for reference):\n";
      for (const concept of context.contextConcepts) {
        formattedContext += `• ${concept.name}: ${concept.description}\n`;
      }
      formattedContext += "\n";
    }

    // Session objectives
    formattedContext += "SESSION OBJECTIVES:\n";
    for (const objective of context.sessionObjectives) {
      formattedContext += `• ${objective}\n`;
    }
    formattedContext += "\n";

    // Special instructions for multi-concept sessions
    if (context.interleaving) {
      formattedContext += "SPECIAL INSTRUCTIONS:\n";
      formattedContext +=
        "• Create questions that combine multiple concepts when possible\n";
      formattedContext +=
        "• Focus on practical application rather than isolated rules\n";
      formattedContext +=
        "• Vary question difficulty to match concept levels\n\n";
    }

    return formattedContext;
  }

  /**
   * Build context for specific question types
   */
  async buildContextForQuestionType(
    conceptIds: string[],
    questionType: "grammar_focus" | "vocabulary_focus" | "mixed"
  ): Promise<string> {
    const baseContext = await this.buildContextForConcepts(conceptIds);

    let typeSpecificInstructions = "";

    switch (questionType) {
      case "grammar_focus":
        typeSpecificInstructions =
          "\nFOCUS: Create questions that test grammatical understanding and application. Include sentence transformation, conjugation, or syntax questions.";
        break;
      case "vocabulary_focus":
        typeSpecificInstructions =
          "\nFOCUS: Create questions that test vocabulary knowledge and usage. Include context clues, word formation, or meaning-in-context questions.";
        break;
      case "mixed":
        typeSpecificInstructions =
          "\nFOCUS: Create questions that integrate both grammar and vocabulary. Focus on real-world language use and communication.";
        break;
    }

    return baseContext + typeSpecificInstructions;
  }

  /**
   * Build context for drill sessions (targeting weaknesses)
   */
  async buildDrillContext(
    conceptIds: string[],
    weaknessAreas: string[]
  ): Promise<string> {
    const baseContext = await this.buildContextForConcepts(conceptIds);

    let drillInstructions = "\nDRILL SESSION FOCUS:\n";
    drillInstructions += "• Target areas where student showed difficulty\n";
    drillInstructions +=
      "• Create slightly easier questions to build confidence\n";
    drillInstructions +=
      "• Focus on fundamental understanding before complexity\n";

    if (weaknessAreas.length > 0) {
      drillInstructions += "\nSPECIFIC WEAKNESS AREAS:\n";
      for (const area of weaknessAreas) {
        drillInstructions += `• ${area}\n`;
      }
    }

    return baseContext + drillInstructions;
  }

  /**
   * Analyze concept organization for smart session planning (group-based)
   */
  async analyzeConceptOrganization(conceptIds: string[]): Promise<{
    clusters: string[][];
    groups: Array<{ groupId: string; groupName: string; concepts: string[] }>;
    combinations: string[][];
  }> {
    const concepts = await Concept.find({
      id: { $in: conceptIds },
      isActive: true,
    });

    const clusters: string[][] = [];
    const groups: Array<{ groupId: string; groupName: string; concepts: string[] }> = [];
    const combinations: string[][] = [];

    // Group by category
    const grammarConcepts = concepts.filter(
      (c) => c.category === ConceptCategory.GRAMMAR
    );
    const vocabularyConcepts = concepts.filter(
      (c) => c.category === ConceptCategory.VOCABULARY
    );

    if (grammarConcepts.length > 0) {
      clusters.push(grammarConcepts.map((c) => c.id));
    }
    if (vocabularyConcepts.length > 0) {
      clusters.push(vocabularyConcepts.map((c) => c.id));
    }

    // Get group-based organization
    try {
      const { default: ConceptGroup } = await import("@/datamodels/conceptGroup.model");
      
      const conceptGroups = await ConceptGroup.find({
        memberConcepts: { $in: conceptIds },
        isActive: true,
      }).lean();

      for (const group of conceptGroups) {
        const conceptsInThisGroup = conceptIds.filter(id => group.memberConcepts.includes(id));
        if (conceptsInThisGroup.length > 0) {
          groups.push({
            groupId: group.id,
            groupName: group.name,
            concepts: conceptsInThisGroup,
          });
        }
      }
    } catch (error) {
      console.warn("Could not load group organization:", error);
    }

    // Generate useful combinations
    if (grammarConcepts.length > 0 && vocabularyConcepts.length > 0) {
      // Mix grammar + vocabulary
      for (const grammar of grammarConcepts) {
        for (const vocab of vocabularyConcepts) {
          combinations.push([grammar.id, vocab.id]);
        }
      }
    }

    return { clusters, groups, combinations };
  }
}
