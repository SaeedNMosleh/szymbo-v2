import { QuestionType, QuestionLevel } from "@/lib/enum";

/**
 * Dynamic content analysis prompt for flexible media generation
 */
export const CONTENT_ANALYSIS_PROMPT = `You are a Polish language and cultural expert analyzing vocabulary for educational media generation.

## TASK: DYNAMIC CONTENT ANALYSIS

Analyze the given Polish word/concept and provide structured context information for media generation.

**Target Word/Concept**: {targetWord}
**Additional Context**: {conceptContext}
**Learning Level**: {difficulty}

## ANALYSIS REQUIREMENTS:

### SEMANTIC ANALYSIS:
- **Category**: Determine the semantic domain (household, nature, food, transport, emotions, actions, etc.)
- **Usage Context**: Identify typical situations where this word is used
- **Cultural Significance**: Note any Polish-specific cultural elements
- **Visual Characteristics**: Describe distinctive visual features for identification

### CONTEXTUAL SCENARIOS:
- **Natural Settings**: Where would learners encounter this concept in real life?
- **Daily Life Integration**: How does this fit into Polish daily routines?
- **Social Contexts**: What social situations involve this concept?
- **Seasonal/Temporal**: Any time-specific usage patterns?

### EDUCATIONAL CONSIDERATIONS:
- **Comprehension Cues**: What environmental elements would help identify the concept?
- **Cultural Elements**: Polish-specific aspects that enhance learning
- **Potential Confusion**: Similar concepts that might cause confusion
- **Learning Progression**: How this concept connects to others at this level

## RESPONSE FORMAT:

Return ONLY a JSON object with this exact structure:

{
  "semanticAnalysis": {
    "primaryCategory": "string",
    "secondaryCategories": ["string", "string"],
    "usageFrequency": "high|medium|low",
    "formalityLevel": "formal|neutral|informal",
    "culturalSignificance": "string"
  },
  "visualContext": {
    "naturalSettings": ["setting1", "setting2", "setting3"],
    "keyVisualElements": ["element1", "element2", "element3"],
    "culturalVisualCues": ["cue1", "cue2"],
    "avoidVisualElements": ["avoid1", "avoid2"]
  },
  "audioContext": {
    "naturalScenarios": ["scenario1", "scenario2", "scenario3"],
    "contextualDialogues": ["dialogue1", "dialogue2"],
    "culturalReferences": ["reference1", "reference2"],
    "comprehensionCues": ["cue1", "cue2"]
  },
  "educationalMetadata": {
    "difficultyJustification": "string",
    "learningObjectives": ["objective1", "objective2"],
    "prerequisiteKnowledge": ["concept1", "concept2"],
    "extensionConcepts": ["extension1", "extension2"]
  }
}`;

/**
 * Image generation prompt template with dynamic context integration
 */
export const IMAGE_GENERATION_PROMPT = `Educational Polish language learning illustration:

## OBJECTIVE: 
Create a visual scene that allows learners to identify the target concept through contextual understanding and visual cues, without showing any text or revealing the answer directly.

## DYNAMIC CONTEXT ANALYSIS:
**Target Concept**: {targetWord}
**Semantic Category**: {primaryCategory}
**Natural Settings**: {naturalSettings}
**Key Visual Elements**: {keyVisualElements}
**Cultural Context**: {culturalContext}
**Additional Context**: {conceptContext}

## SCENE COMPOSITION:
- **Primary Setting**: {primarySetting}
- **Visual Elements**: {sceneElements}
- **Cultural Integration**: {culturalElements}
- **Contextual Cues**: {contextualCues}

## EDUCATIONAL REQUIREMENTS:
- NO visible text, words, letters, or labels anywhere in the image
- Show the concept through its natural context and usage
- Include environmental cues that aid comprehension without revealing the answer
- Use visual storytelling to convey meaning through context
- Make the target concept identifiable through situation and environmental clues
- Avoid elements that directly show or spell out the answer

## VISUAL STYLE:
- Clear, professional illustration style appropriate for language learning
- Bright, engaging colors suitable for educational content
- Clean composition with high contrast for clarity
- Cartoon/illustration style rather than photorealistic
- Culturally appropriate for international learners
- Polish cultural elements where relevant to enhance context

## SCENE DETAILS:
- Include realistic props and environmental elements that provide context
- Show typical usage scenarios or natural environments
- Add Polish cultural elements that enhance language learning context
- Ensure visual clarity for educational assessment and comprehension
- Create multiple visual cues that point to the target concept without revealing it directly

## CONTEXTUAL INTEGRATION:
{additionalContextualElements}

Remember: Students will see this image and need to identify the Polish concept through contextual understanding and environmental cues alone, without any text or direct visual revelation of the answer.`;

/**
 * Audio generation prompt template with scenario-based approach
 */
export const AUDIO_GENERATION_PROMPT = `Create contextual Polish audio content for language learning comprehension.

## OBJECTIVE:
Generate natural Polish speech that allows learners to identify the target concept through contextual understanding, without directly stating the answer.

## DYNAMIC CONTEXT ANALYSIS:
**Target Concept**: {targetWord}
**Semantic Category**: {primaryCategory}
**Natural Scenarios**: {naturalScenarios}
**Contextual Dialogues**: {contextualDialogues}
**Cultural References**: {culturalReferences}
**Learning Level**: {difficulty}

## AUDIO CONTENT STRATEGY:
Create a natural Polish dialogue or monologue that:
- Uses the target concept in context without directly naming it
- Provides sufficient contextual cues for comprehension
- Incorporates appropriate vocabulary for the difficulty level
- Includes cultural elements that enhance learning
- Uses natural speech patterns and intonation

## SCENARIO SELECTION:
Based on the semantic analysis, select the most appropriate scenario:
- **Daily Life Scenario**: {dailyLifeContext}
- **Social Interaction**: {socialContext}
- **Cultural Context**: {culturalContext}
- **Educational Setting**: {educationalContext}

## CONTENT REQUIREMENTS:
- Natural, conversational Polish appropriate for {difficulty} level
- Context clues that lead to the target concept identification
- Cultural authenticity in language use and references
- Make it brief and consice 
- Clear pronunciation for language learners
- Engaging narrative that maintains listener attention

## RESPONSE FORMAT:
Generate Polish audio content as a natural dialogue or monologue that incorporates the target concept contextually.

Content: "{audioContent}"

The content should be ready for text-to-speech generation and provide adequate context for learners to identify the target concept through comprehension rather than direct statement.`;

/**
 * System prompts for media generation services
 */
export const MEDIA_GENERATION_SYSTEM_PROMPT =
  "You are an expert Polish language and culture specialist creating educational media content for language learners. Your focus is on creating contextual, culturally authentic content that enhances comprehension without revealing answers directly.";

export const CONTENT_ANALYSIS_SYSTEM_PROMPT =
  "You are a Polish language expert specializing in semantic analysis and educational content design. Provide precise, structured analysis for educational media generation.";

/**
 * Fallback scenarios for edge cases where dynamic analysis might not provide sufficient context
 */
export const FALLBACK_SCENARIOS = {
  visual: {
    abstract:
      "Person in thoughtful pose with symbolic representations of the concept in thought bubbles or environmental elements",
    action:
      "Person performing or demonstrating the concept in a natural, everyday setting",
    object:
      "Everyday scene where the object would naturally appear in use or context",
    emotion:
      "Person expressing or experiencing the emotional state in a relatable social situation",
  },
  audio: {
    abstract:
      "Osoba myśli o tym pojęciu. Jest to bardzo ważne w codziennym życiu. Co to może być?",
    action:
      "Widzę kogoś, kto robi coś ciekawego. Ta czynność jest bardzo przydatna. Co robi ta osoba?",
    object:
      "Potrzebuję czegoś do wykonania zadania. Ten przedmiot jest bardzo pomocny. Czego szukam?",
    emotion:
      "Osoba czuje się w określony sposób. Ten stan emocjonalny jest naturalny w tej sytuacji. Jak się czuje?",
  },
};

/**
 * Dynamic content analysis interface for type safety
 */
export interface ContentAnalysis {
  semanticAnalysis: {
    primaryCategory: string;
    secondaryCategories: string[];
    usageFrequency: "high" | "medium" | "low";
    formalityLevel: "formal" | "neutral" | "informal";
    culturalSignificance: string;
  };
  visualContext: {
    naturalSettings: string[];
    keyVisualElements: string[];
    culturalVisualCues: string[];
    avoidVisualElements: string[];
  };
  audioContext: {
    naturalScenarios: string[];
    contextualDialogues: string[];
    culturalReferences: string[];
    comprehensionCues: string[];
  };
  educationalMetadata: {
    difficultyJustification: string;
    learningObjectives: string[];
    prerequisiteKnowledge: string[];
    extensionConcepts: string[];
  };
}

/**
 * Enhanced prompt builders with dynamic context integration
 */
export class MediaPromptBuilder {
  static buildImagePrompt(
    targetWord: string,
    analysis: ContentAnalysis,
    conceptContext?: string
  ): string {
    const primarySetting =
      analysis.visualContext.naturalSettings[0] || "everyday environment";
    const sceneElements = analysis.visualContext.keyVisualElements
      .slice(0, 3)
      .join(", "); // Limit to 3 elements
    const culturalElements = analysis.visualContext.culturalVisualCues
      .slice(0, 2)
      .join(", "); // Limit to 2 elements
    const contextualCues = analysis.audioContext.comprehensionCues
      .slice(0, 3)
      .join(", "); // Limit to 3 elements

    // Truncate conceptContext if it's too long
    const truncatedConceptContext =
      conceptContext && conceptContext.length > 200
        ? conceptContext.substring(0, 200) + "..."
        : conceptContext || "";

    return IMAGE_GENERATION_PROMPT.replace("{targetWord}", targetWord)
      .replace("{primaryCategory}", analysis.semanticAnalysis.primaryCategory)
      .replace(
        "{naturalSettings}",
        analysis.visualContext.naturalSettings.slice(0, 2).join(", ")
      ) // Limit settings
      .replace("{keyVisualElements}", sceneElements)
      .replace(
        "{culturalContext}",
        analysis.semanticAnalysis.culturalSignificance.length > 150
          ? analysis.semanticAnalysis.culturalSignificance.substring(0, 150) +
              "..."
          : analysis.semanticAnalysis.culturalSignificance
      )
      .replace("{conceptContext}", truncatedConceptContext)
      .replace("{primarySetting}", primarySetting)
      .replace("{sceneElements}", sceneElements)
      .replace("{culturalElements}", culturalElements)
      .replace("{contextualCues}", contextualCues)
      .replace(
        "{additionalContextualElements}",
        truncatedConceptContext
          ? `Additional Context: ${truncatedConceptContext}`
          : ""
      );
  }

  static buildAudioPrompt(
    targetWord: string,
    analysis: ContentAnalysis,
    difficulty: QuestionLevel,
    conceptContext?: string
  ): string {
    const dailyLifeContext =
      analysis.audioContext.naturalScenarios[0] || "everyday situation";
    const socialContext =
      analysis.audioContext.naturalScenarios[1] || "social interaction";
    const culturalContext = analysis.semanticAnalysis.culturalSignificance;
    const educationalContext =
      analysis.educationalMetadata.learningObjectives.join(", ");
    const truncatedConceptContext =
      conceptContext && conceptContext.length > 100
        ? conceptContext.substring(0, 100) + "..."
        : conceptContext || "";

    return AUDIO_GENERATION_PROMPT.replace("{targetWord}", targetWord)
      .replace("{primaryCategory}", analysis.semanticAnalysis.primaryCategory)
      .replace(
        "{naturalScenarios}",
        analysis.audioContext.naturalScenarios.join(", ")
      )
      .replace(
        "{contextualDialogues}",
        analysis.audioContext.contextualDialogues.join(", ")
      )
      .replace(
        "{culturalReferences}",
        analysis.audioContext.culturalReferences.join(", ")
      )
      .replace("{difficulty}", difficulty)
      .replace("{dailyLifeContext}", dailyLifeContext)
      .replace("{socialContext}", socialContext)
      .replace("{culturalContext}", culturalContext)
      .replace("{educationalContext}", educationalContext)
      .replace("{conceptContext}", truncatedConceptContext);
  }

  static buildContentAnalysisPrompt(
    targetWord: string,
    difficulty: QuestionLevel,
    conceptContext?: string
  ): string {
    return CONTENT_ANALYSIS_PROMPT.replace("{targetWord}", targetWord)
      .replace(
        "{conceptContext}",
        conceptContext || "No additional context provided"
      )
      .replace("{difficulty}", difficulty);
  }
}
