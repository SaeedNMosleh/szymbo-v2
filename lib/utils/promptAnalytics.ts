import { IConcept } from "@/datamodels/concept.model";
import { QuestionType, QuestionLevel, OPENAI_LIMITS } from "@/lib/enum";
import {
  PERFORMANCE_ANALYTICS_CONTEXT,
  ANALYTICS_GUIDANCE_TEMPLATE,
  CONCEPT_ANALYTICS_INTEGRATION,
  QUESTION_ANALYTICS_INTEGRATION,
} from "@/prompts/shared";

/**
 * Analytics data for performance-informed prompt generation
 */
export interface PromptAnalyticsData {
  conceptSuccessRates: Map<string, number>;
  questionTypePerformance: Map<QuestionType, number>;
  commonMistakePatterns: Map<string, string[]>;
  learnerProficiencyData: {
    estimatedLevel: QuestionLevel;
    strengths: string[];
    weaknesses: string[];
    progressTrend: "improving" | "stable" | "declining";
  };
}

/**
 * Concept-specific analytics for targeted content generation
 */
export interface ConceptAnalytics {
  successRate: number;
  commonErrors: string[];
  estimatedPracticeRounds: number;
  relatedConcepts: string[];
  preferredQuestionTypes: QuestionType[];
  difficultyAssessment: "too_easy" | "appropriate" | "too_difficult";
}

/**
 * Question-level analytics for optimization
 */
export interface QuestionAnalytics {
  predictedSuccessRate: number;
  anticipatedMistakes: string[];
  estimatedCompletionTime: number;
  cognitiveLoadLevel: "low" | "medium" | "high";
  predictedEngagement: "low" | "medium" | "high";
  difficultyRecommendation: "easier" | "maintain" | "harder";
  optimalFormat: string;
  contextualImprovements: string[];
}

/**
 * Comprehensive analytics integration service for prompt enhancement
 */
export class PromptAnalyticsIntegrator {
  /**
   * Integrates performance analytics into concept extraction prompts
   */
  static enhanceConceptExtractionPrompt(
    basePrompt: string,
    analyticsData: PromptAnalyticsData,
    courseContext?: {
      courseType?: string;
      mainSubjects?: string[];
      newSubjects?: string[];
      reviewSubjects?: string[];
      courseId?: number;
      date?: Date;
    }
  ): string {
    const performanceContext = this.buildPerformanceContext(analyticsData);
    const analyticsGuidance = this.buildAnalyticsGuidance();

    return basePrompt
      .replace("{performanceContext}", performanceContext)
      .replace("{analyticsGuidance}", analyticsGuidance)
      .replace("{courseType}", courseContext?.courseType || "general")
      .replace(
        "{mainSubjects}",
        JSON.stringify(courseContext?.mainSubjects || [])
      )
      .replace(
        "{newSubjects}",
        JSON.stringify(courseContext?.newSubjects || [])
      )
      .replace(
        "{reviewSubjects}",
        JSON.stringify(courseContext?.reviewSubjects || [])
      )
      .replace(
        "{strengths}",
        JSON.stringify(analyticsData.learnerProficiencyData.strengths)
      )
      .replace(
        "{weaknesses}",
        JSON.stringify(analyticsData.learnerProficiencyData.weaknesses)
      )
      .replace("{courseId}", courseContext?.courseId?.toString() || "unknown")
      .replace("{date}", courseContext?.date?.toDateString() || "recent");
  }

  /**
   * Enhances question generation prompts with performance analytics
   */
  static enhanceQuestionGenerationPrompt(
    basePrompt: string,
    concepts: IConcept[],
    analyticsData: PromptAnalyticsData,
    questionType: QuestionType,
    difficulty: QuestionLevel
  ): string {
    const conceptMetadata = this.buildConceptMetadata(concepts, analyticsData);
    const performanceContext = this.buildPerformanceContext(analyticsData);
    const analyticsGuidance = this.buildAnalyticsGuidance();
    const questionAnalytics = this.buildQuestionAnalytics(
      questionType,
      difficulty,
      analyticsData
    );

    return basePrompt
      .replace("{conceptMetadata}", conceptMetadata)
      .replace("{performanceContext}", performanceContext)
      .replace("{analyticsGuidance}", analyticsGuidance)
      .replace("{questionAnalytics}", questionAnalytics);
  }

  /**
   * Enhances validation prompts with learner-specific analytics
   */
  static enhanceValidationPrompt(
    basePrompt: string,
    targetConcepts: string[],
    conceptDescriptions: string,
    analyticsData: PromptAnalyticsData,
    questionType: QuestionType,
    questionLevel: QuestionLevel
  ): string {
    const performanceContext = this.buildPerformanceContext(analyticsData);
    const commonMistakes = this.getCommonMistakesForConcepts(
      targetConcepts,
      analyticsData
    );

    return basePrompt
      .replace("{targetConcepts}", targetConcepts.join(", "))
      .replace("{conceptDescriptions}", conceptDescriptions)
      .replace("{performanceContext}", performanceContext)
      .replace("{commonMistakes}", commonMistakes)
      .replace("{questionType}", questionType)
      .replace("{questionLevel}", questionLevel);
  }

  /**
   * Builds comprehensive performance context for prompts
   */
  private static buildPerformanceContext(
    analyticsData: PromptAnalyticsData
  ): string {
    const conceptRates = Array.from(analyticsData.conceptSuccessRates.entries())
      .map(([concept, rate]) => `${concept}: ${(rate * 100).toFixed(1)}%`)
      .join(", ");

    const questionTypePerf = Array.from(
      analyticsData.questionTypePerformance.entries()
    )
      .map(([type, rate]) => `${type}: ${(rate * 100).toFixed(1)}%`)
      .join(", ");

    const mistakes = Array.from(analyticsData.commonMistakePatterns.entries())
      .map(([concept, errors]) => `${concept}: ${errors.join(", ")}`)
      .join("; ");

    return PERFORMANCE_ANALYTICS_CONTEXT.replace(
      "{conceptSuccessRates}",
      conceptRates
    )
      .replace("{questionTypePerformance}", questionTypePerf)
      .replace(
        "{learnerProficiencyData}",
        JSON.stringify(analyticsData.learnerProficiencyData)
      )
      .replace("{commonMistakePatterns}", mistakes);
  }

  /**
   * Builds analytics-informed guidance for content generation
   */
  private static buildAnalyticsGuidance(): string {
    return ANALYTICS_GUIDANCE_TEMPLATE; // Template is already comprehensive
  }

  /**
   * Builds concept-specific metadata integration
   */
  private static buildConceptMetadata(
    concepts: IConcept[],
    analyticsData: PromptAnalyticsData
  ): string {
    return concepts
      .map((concept) => {
        const successRate =
          analyticsData.conceptSuccessRates.get(concept.id) || 0.5;
        const commonErrors =
          analyticsData.commonMistakePatterns.get(concept.id) || [];

        const analytics: ConceptAnalytics = {
          successRate: successRate * 100,
          commonErrors,
          estimatedPracticeRounds: this.estimatePracticeRounds(successRate),
          relatedConcepts: this.findRelatedConcepts(concept, concepts),
          preferredQuestionTypes: this.getPreferredQuestionTypes(
            analyticsData
          ),
          difficultyAssessment: this.assessDifficulty(successRate),
        };

        return CONCEPT_ANALYTICS_INTEGRATION.replace(
          "{conceptSuccessRate}",
          analytics.successRate.toFixed(1)
        )
          .replace("{difficultyAssessment}", analytics.difficultyAssessment)
          .replace("{commonErrors}", analytics.commonErrors.join(", "))
          .replace(
            "{estimatedPracticeRounds}",
            analytics.estimatedPracticeRounds.toString()
          )
          .replace("{relatedConcepts}", analytics.relatedConcepts.join(", "))
          .replace(
            "{preferredQuestionTypes}",
            analytics.preferredQuestionTypes.join(", ")
          );
      })
      .join("\n\n");
  }

  /**
   * Builds question-level analytics integration
   */
  private static buildQuestionAnalytics(
    questionType: QuestionType,
    difficulty: QuestionLevel,
    analyticsData: PromptAnalyticsData
  ): string {
    const typePerformance =
      analyticsData.questionTypePerformance.get(questionType) || 0.5;

    const analytics: QuestionAnalytics = {
      predictedSuccessRate: typePerformance * 100,
      anticipatedMistakes: this.getAnticipatedMistakes(
        questionType
      ),
      estimatedCompletionTime: this.estimateCompletionTime(
        questionType,
        difficulty
      ),
      cognitiveLoadLevel: this.assessCognitiveLoad(questionType, difficulty),
      predictedEngagement: this.predictEngagement(questionType, analyticsData),
      difficultyRecommendation: this.recommendDifficulty(typePerformance),
      optimalFormat: this.suggestOptimalFormat(questionType),
      contextualImprovements: this.suggestContextualImprovements(),
    };

    return QUESTION_ANALYTICS_INTEGRATION.replace(
      "{predictedSuccessRate}",
      analytics.predictedSuccessRate.toFixed(1)
    )
      .replace(
        "{anticipatedMistakes}",
        analytics.anticipatedMistakes.join(", ")
      )
      .replace(
        "{estimatedCompletionTime}",
        analytics.estimatedCompletionTime.toString()
      )
      .replace("{cognitiveLoadLevel}", analytics.cognitiveLoadLevel)
      .replace("{predictedEngagement}", analytics.predictedEngagement)
      .replace("{difficultyRecommendation}", analytics.difficultyRecommendation)
      .replace("{optimalFormat}", analytics.optimalFormat)
      .replace(
        "{contextualImprovements}",
        analytics.contextualImprovements.join(", ")
      );
  }

  /**
   * Gets common mistakes for specific concepts
   */
  private static getCommonMistakesForConcepts(
    concepts: string[],
    analyticsData: PromptAnalyticsData
  ): string {
    return (
      concepts
        .map((concept) => {
          const mistakes =
            analyticsData.commonMistakePatterns.get(concept) || [];
          return mistakes.length > 0
            ? `${concept}: ${mistakes.join(", ")}`
            : null;
        })
        .filter(Boolean)
        .join("; ") || "No specific patterns identified"
    );
  }

  // Helper methods for analytics calculations
  private static estimatePracticeRounds(successRate: number): number {
    if (successRate > 0.8) return 2;
    if (successRate > 0.6) return 3;
    if (successRate > 0.4) return 4;
    return 5;
  }

  private static findRelatedConcepts(
    concept: IConcept,
    allConcepts: IConcept[]
  ): string[] {
    return allConcepts
      .filter(
        (c) =>
          c.id !== concept.id &&
          (c.category === concept.category ||
            c.tags.some((tag) => concept.tags.includes(tag)))
      )
      .slice(0, 3)
      .map((c) => c.name);
  }

  private static getPreferredQuestionTypes(
    analyticsData: PromptAnalyticsData
  ): QuestionType[] {
    // Return top 3 question types based on performance
    return Array.from(analyticsData.questionTypePerformance.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
  }

  private static assessDifficulty(
    successRate: number
  ): "too_easy" | "appropriate" | "too_difficult" {
    if (successRate > 0.85) return "too_easy";
    if (successRate < 0.4) return "too_difficult";
    return "appropriate";
  }

  private static getAnticipatedMistakes(
    questionType: QuestionType
  ): string[] {
    // Map question types to common mistake patterns
    const mistakeMap: Partial<Record<QuestionType, string[]>> = {
      [QuestionType.BASIC_CLOZE]: ["case endings", "verb forms"],
      [QuestionType.VOCAB_CHOICE]: ["word confusion", "false friends"],
      [QuestionType.TRANSLATION_PL]: ["word order", "idiomatic expressions"],
      // Add more mappings as needed
    };

    return (
      mistakeMap[questionType] || ["grammatical errors", "vocabulary confusion"]
    );
  }

  private static estimateCompletionTime(
    questionType: QuestionType,
    difficulty: QuestionLevel
  ): number {
    const baseTime: Partial<Record<QuestionType, number>> = {
      [QuestionType.BASIC_CLOZE]: 15,
      [QuestionType.VOCAB_CHOICE]: 12,
      [QuestionType.TRANSLATION_PL]: 25,
      [QuestionType.CONJUGATION_TABLE]: 30,
    };

    const difficultyMultiplier = {
      [QuestionLevel.A1]: 0.8,
      [QuestionLevel.A2]: 1.0,
      [QuestionLevel.B1]: 1.2,
      [QuestionLevel.B2]: 1.4,
      [QuestionLevel.C1]: 1.6,
      [QuestionLevel.C2]: 1.8,
    };

    return Math.round(
      (baseTime[questionType] || 20) * difficultyMultiplier[difficulty]
    );
  }

  private static assessCognitiveLoad(
    questionType: QuestionType,
    difficulty: QuestionLevel
  ): "low" | "medium" | "high" {
    const complexTypes = [
      QuestionType.CONJUGATION_TABLE,
      QuestionType.SENTENCE_TRANSFORM,
      QuestionType.TRANSLATION_PL,
    ];
    const advancedLevels = [
      QuestionLevel.B2,
      QuestionLevel.C1,
      QuestionLevel.C2,
    ];

    if (
      complexTypes.includes(questionType) &&
      advancedLevels.includes(difficulty)
    )
      return "high";
    if (
      complexTypes.includes(questionType) ||
      advancedLevels.includes(difficulty)
    )
      return "medium";
    return "low";
  }

  private static predictEngagement(
    questionType: QuestionType,
    analyticsData: PromptAnalyticsData
  ): "low" | "medium" | "high" {
    const performance =
      analyticsData.questionTypePerformance.get(questionType) || 0.5;
    if (performance > 0.7) return "high";
    if (performance > 0.4) return "medium";
    return "low";
  }

  private static recommendDifficulty(
    performance: number
  ): "easier" | "maintain" | "harder" {
    if (performance > 0.8) return "harder";
    if (performance < 0.4) return "easier";
    return "maintain";
  }

  private static suggestOptimalFormat(
    questionType: QuestionType
  ): string {
    // Return the best performing similar format
    return `Enhanced ${questionType} with contextual scaffolding`;
  }

  private static suggestContextualImprovements(): string[] {
    return [
      "Add cultural context",
      "Include usage examples",
      "Provide pronunciation guides",
      "Connect to daily life scenarios",
    ];
  }
}

/**
 * Prompt length monitoring and analysis utilities
 */
export interface PromptLengthAnalytics {
  totalLength: number;
  isWithinLimit: boolean;
  limitUsagePercentage: number;
  sections: {
    [sectionName: string]: {
      length: number;
      percentage: number;
    };
  };
}

/**
 * Analyze a prompt's structure and length distribution for OpenAI models
 */
export function analyzePromptLength(
  prompt: string,
  model: "dalle-2" | "dalle-3" = "dalle-3"
): PromptLengthAnalytics {
  const maxLength =
    model === "dalle-3"
      ? OPENAI_LIMITS.DALLE_3_PROMPT_MAX_LENGTH
      : OPENAI_LIMITS.DALLE_2_PROMPT_MAX_LENGTH;

  const sections: { [key: string]: { length: number; percentage: number } } =
    {};

  // Analyze sections by looking for common headers in image prompts
  const sectionPatterns = [
    { name: "Objective", pattern: /## OBJECTIVE:([\s\S]*?)(?=##|$)/ },
    {
      name: "Context Analysis",
      pattern: /## DYNAMIC CONTEXT ANALYSIS:([\s\S]*?)(?=##|$)/,
    },
    {
      name: "Scene Composition",
      pattern: /## SCENE COMPOSITION:([\s\S]*?)(?=##|$)/,
    },
    {
      name: "Educational Requirements",
      pattern: /## EDUCATIONAL REQUIREMENTS:([\s\S]*?)(?=##|$)/,
    },
    { name: "Visual Style", pattern: /## VISUAL STYLE:([\s\S]*?)(?=##|$)/ },
  ];

  sectionPatterns.forEach(({ name, pattern }) => {
    const match = prompt.match(pattern);
    if (match) {
      const sectionLength = match[1].length;
      sections[name] = {
        length: sectionLength,
        percentage: (sectionLength / prompt.length) * 100,
      };
    }
  });

  // Add any remaining content as "Other"
  const analyzedLength = Object.values(sections).reduce(
    (sum, section) => sum + section.length,
    0
  );
  if (analyzedLength < prompt.length) {
    sections.Other = {
      length: prompt.length - analyzedLength,
      percentage: ((prompt.length - analyzedLength) / prompt.length) * 100,
    };
  }

  return {
    totalLength: prompt.length,
    isWithinLimit: prompt.length <= maxLength,
    limitUsagePercentage: (prompt.length / maxLength) * 100,
    sections,
  };
}

/**
 * Log prompt analytics for debugging (development only)
 */
export function logPromptAnalytics(
  prompt: string,
  context: string = "Unknown",
  model: "dalle-2" | "dalle-3" = "dalle-3"
): void {
  if (process.env.NODE_ENV !== "development") return;

  const analytics = analyzePromptLength(prompt, model);

  console.log(`📊 Prompt Analytics - ${context}:`);
  console.log(`Total Length: ${analytics.totalLength} characters`);
  console.log(`Limit Usage: ${analytics.limitUsagePercentage.toFixed(1)}%`);
  console.log(`Within Limit: ${analytics.isWithinLimit ? "✅" : "❌"}`);

  if (Object.keys(analytics.sections).length > 0) {
    console.log("Section Breakdown:");
    Object.entries(analytics.sections)
      .sort(([, a], [, b]) => b.length - a.length)
      .forEach(([name, data]) => {
        console.log(
          `  ${name}: ${data.length} chars (${data.percentage.toFixed(1)}%)`
        );
      });
  }

  if (!analytics.isWithinLimit) {
    const excess =
      analytics.totalLength -
      (model === "dalle-3"
        ? OPENAI_LIMITS.DALLE_3_PROMPT_MAX_LENGTH
        : OPENAI_LIMITS.DALLE_2_PROMPT_MAX_LENGTH);
    console.warn(`⚠️ Prompt exceeds limit by ${excess} characters`);
  }
}
