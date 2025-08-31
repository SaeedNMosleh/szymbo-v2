import { OpenAIService } from "./llm/openAIService";
import { QuestionLevel } from "@/lib/enum";
import {
  CONTENT_ANALYSIS_SYSTEM_PROMPT,
  ContentAnalysis,
  FALLBACK_SCENARIOS,
  MediaPromptBuilder,
} from "@/prompts/mediaGeneration";

/**
 * Dynamic content analysis service replacing hardcoded regex patterns
 * Provides flexible, LLM-based analysis of Polish vocabulary for media generation
 */
export class ContentAnalysisService {
  private llmService: OpenAIService;

  constructor() {
    this.llmService = new OpenAIService({
      apiKey: process.env.OPENAI_API_KEY!,
      model: "gpt-4o-mini",
      temperature: 0.3,
      maxTokens: 800,
    });
  }

  /**
   * Analyzes Polish vocabulary dynamically using LLM instead of hardcoded patterns
   */
  async analyzeContent(
    targetWord: string,
    difficulty: QuestionLevel,
    conceptContext?: string
  ): Promise<ContentAnalysis> {
    try {
      const prompt = MediaPromptBuilder.buildContentAnalysisPrompt(
        targetWord,
        difficulty,
        conceptContext
      );

      const response = await this.llmService.generateResponse({
        prompt,
        systemPrompt: CONTENT_ANALYSIS_SYSTEM_PROMPT,
      });

      // Parse the LLM response as JSON
      const analysis = this.parseAnalysisResponse(response.data || "");

      // Validate and provide fallbacks if needed
      return this.validateAndEnhanceAnalysis(analysis, targetWord, difficulty);
    } catch (error) {
      console.error("Error in dynamic content analysis:", error);

      // Provide intelligent fallback based on basic linguistic analysis
      return this.generateFallbackAnalysis(
        targetWord,
        difficulty,
        conceptContext
      );
    }
  }

  /**
   * Parse LLM response with error handling and validation
   */
  private parseAnalysisResponse(response: string): ContentAnalysis {
    try {
      // Clean response of any markdown formatting
      const cleanedResponse = response
        .replace(/```json\s*/, "")
        .replace(/```\s*$/, "")
        .trim();

      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Failed to parse analysis response:", error);
      throw new Error("Invalid analysis response format");
    }
  }

  /**
   * Validate analysis response and provide intelligent defaults
   */
  private validateAndEnhanceAnalysis(
    analysis: Partial<ContentAnalysis>,
    targetWord: string,
    difficulty: QuestionLevel
  ): ContentAnalysis {
    // Ensure all required fields are present with intelligent defaults
    const validated: ContentAnalysis = {
      semanticAnalysis: {
        primaryCategory:
          analysis.semanticAnalysis?.primaryCategory || "general vocabulary",
        secondaryCategories:
          analysis.semanticAnalysis?.secondaryCategories || [],
        usageFrequency: analysis.semanticAnalysis?.usageFrequency || "medium",
        formalityLevel: analysis.semanticAnalysis?.formalityLevel || "neutral",
        culturalSignificance:
          analysis.semanticAnalysis?.culturalSignificance ||
          "Standard Polish vocabulary used in everyday contexts",
      },
      visualContext: {
        naturalSettings: analysis.visualContext?.naturalSettings?.slice(
          0,
          3
        ) || ["everyday environment", "home setting", "social situation"],
        keyVisualElements: analysis.visualContext?.keyVisualElements?.slice(
          0,
          4
        ) || ["contextual objects", "people interacting", "environmental cues"],
        culturalVisualCues: analysis.visualContext?.culturalVisualCues || [
          "Polish cultural elements",
        ],
        avoidVisualElements: analysis.visualContext?.avoidVisualElements || [
          "text",
          "labels",
          "direct word representations",
        ],
      },
      audioContext: {
        naturalScenarios: analysis.audioContext?.naturalScenarios?.slice(
          0,
          3
        ) || [
          "daily conversation",
          "practical situation",
          "social interaction",
        ],
        contextualDialogues: analysis.audioContext?.contextualDialogues || [
          "natural speech patterns",
          "contextual usage",
        ],
        culturalReferences: analysis.audioContext?.culturalReferences || [
          "Polish conversational style",
        ],
        comprehensionCues: analysis.audioContext?.comprehensionCues || [
          "contextual hints",
          "environmental sounds",
        ],
      },
      educationalMetadata: {
        difficultyJustification:
          analysis.educationalMetadata?.difficultyJustification ||
          `Appropriate for ${difficulty} level learners`,
        learningObjectives: analysis.educationalMetadata
          ?.learningObjectives || [
          "vocabulary recognition",
          "contextual comprehension",
        ],
        prerequisiteKnowledge: analysis.educationalMetadata
          ?.prerequisiteKnowledge || ["basic Polish vocabulary"],
        extensionConcepts: analysis.educationalMetadata?.extensionConcepts || [
          "related vocabulary",
          "usage patterns",
        ],
      },
    };

    return validated;
  }

  /**
   * Generate intelligent fallback analysis when LLM analysis fails
   */
  private generateFallbackAnalysis(
    targetWord: string,
    difficulty: QuestionLevel,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _conceptContext?: string
  ): ContentAnalysis {
    // Basic linguistic analysis for fallback
    const wordLower = targetWord.toLowerCase();
    let category = "general vocabulary";
    let settings = ["everyday environment"];
    let scenarios = ["daily conversation"];

    // Simple pattern recognition for common categories (non-exhaustive, just safety net)
    if (this.isHouseholdWord(wordLower)) {
      category = "household";
      settings = ["home interior", "domestic environment", "family setting"];
      scenarios = ["home conversation", "daily routines", "family interaction"];
    } else if (this.isFoodWord(wordLower)) {
      category = "food";
      settings = ["kitchen", "restaurant", "market"];
      scenarios = ["meal preparation", "dining", "shopping"];
    } else if (this.isActionWord(wordLower)) {
      category = "actions";
      settings = ["active environment", "workplace", "social setting"];
      scenarios = [
        "describing activities",
        "daily tasks",
        "social interaction",
      ];
    }

    return {
      semanticAnalysis: {
        primaryCategory: category,
        secondaryCategories: ["basic vocabulary"],
        usageFrequency: "medium",
        formalityLevel: "neutral",
        culturalSignificance: "Common Polish vocabulary with cultural context",
      },
      visualContext: {
        naturalSettings: settings,
        keyVisualElements: [
          "contextual objects",
          "people in natural situations",
          "environmental cues",
        ],
        culturalVisualCues: [
          "Polish cultural elements",
          "authentic environments",
        ],
        avoidVisualElements: ["text", "labels", "direct representations"],
      },
      audioContext: {
        naturalScenarios: scenarios,
        contextualDialogues: ["natural conversation", "contextual usage"],
        culturalReferences: ["Polish conversational patterns"],
        comprehensionCues: ["vocal emphasis", "contextual pauses"],
      },
      educationalMetadata: {
        difficultyJustification: `Suitable for ${difficulty} level with appropriate context`,
        learningObjectives: [
          "vocabulary recognition through context",
          "cultural understanding",
        ],
        prerequisiteKnowledge: ["basic Polish language foundation"],
        extensionConcepts: ["related vocabulary in same semantic field"],
      },
    };
  }

  /**
   * Basic pattern recognition helpers for fallback scenarios (non-exhaustive)
   */
  private isHouseholdWord(word: string): boolean {
    return /dom|mieszkanie|pokój|kuchnia|łazienka|salon|meble/.test(word);
  }

  private isFoodWord(word: string): boolean {
    return /jedzenie|obiad|śniadanie|kolacja|chleb|mleko|ser|mięso|warzywa|owoce/.test(
      word
    );
  }

  private isActionWord(word: string): boolean {
    return (
      /ć$|wać$|ować$|nąć$/.test(word) || /robi|idzi|czyta|pisz|słuch/.test(word)
    );
  }

  /**
   * Get appropriate fallback content based on semantic analysis
   */
  getFallbackContent(
    analysis: ContentAnalysis,
    mediaType: "visual" | "audio"
  ): string {
    const category = analysis.semanticAnalysis.primaryCategory.toLowerCase();

    if (mediaType === "audio") {
      if (category.includes("action") || category.includes("verb")) {
        return FALLBACK_SCENARIOS.audio.action;
      } else if (category.includes("emotion") || category.includes("feeling")) {
        return FALLBACK_SCENARIOS.audio.emotion;
      } else if (
        category.includes("abstract") ||
        category.includes("concept")
      ) {
        return FALLBACK_SCENARIOS.audio.abstract;
      } else {
        return FALLBACK_SCENARIOS.audio.object;
      }
    } else {
      if (category.includes("action") || category.includes("verb")) {
        return FALLBACK_SCENARIOS.visual.action;
      } else if (category.includes("emotion") || category.includes("feeling")) {
        return FALLBACK_SCENARIOS.visual.emotion;
      } else if (
        category.includes("abstract") ||
        category.includes("concept")
      ) {
        return FALLBACK_SCENARIOS.visual.abstract;
      } else {
        return FALLBACK_SCENARIOS.visual.object;
      }
    }
  }
}
