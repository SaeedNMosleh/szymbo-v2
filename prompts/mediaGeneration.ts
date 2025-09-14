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
 * Simplified and focused image generation prompt for educational quality
 */
export const IMAGE_GENERATION_PROMPT = `Create a clear, educational illustration for Polish language learning.

## LEARNING OBJECTIVE:
Design a simple, colorful illustration that shows the target concept in its natural context, allowing learners to identify it through visual clues and situational understanding.

## TARGET CONCEPT:
**Word/Concept**: {targetWord}
**Difficulty Level**: {difficulty}
**Learning Goal**: Help learners visually recognize and associate this concept with its usage

## VISUAL REQUIREMENTS:
- **Style**: Clean, colorful cartoon illustration (not photorealistic)
- **Composition**: Simple scene with 3-5 main elements maximum
- **Colors**: Bright, engaging colors suitable for language learners
- **Clarity**: High contrast, easy to see details
- **NO TEXT**: Absolutely no letters, words, or labels anywhere

## EDUCATIONAL DESIGN:
- **Contextual Learning**: Show the concept being used in a natural situation
- **Visual Cues**: Include environmental clues that help identify the concept
- **Cultural Elements**: Add subtle Polish cultural context when appropriate
- **Focus**: Center the illustration on the target concept's usage or appearance
- **Simplicity**: Avoid cluttered scenes - keep it clear and focused

## SCENE IDEAS BY CONCEPT TYPE:
- **Objects**: Show the object in its typical location or being used
- **Actions**: Show people performing the action in context
- **Places**: Show characteristic features and activities
- **Food**: Show in a meal setting or preparation context
- **Animals**: Show in natural habitat with key features visible

## QUALITY CHECKLIST:
- ✅ Concept is clearly identifiable through context
- ✅ No text or labels visible anywhere
- ✅ Appropriate for {difficulty} level learners
- ✅ Culturally relevant Polish elements included
- ✅ Clear, engaging educational illustration style

## EXAMPLE PROMPTS:
For "jabłko" (apple): "Colorful illustration of a Polish farmer's market stall with fresh red apples in baskets, Polish bread, and people shopping"
For "szkoła" (school): "Bright classroom scene with children at desks, teacher at blackboard, books and pencils, Polish flag in corner"

Generate the image based on: {targetWord} in Polish cultural context`;

/**
 * Simplified and focused audio generation prompt for educational quality
 */
export const AUDIO_GENERATION_PROMPT = `Create clear, educational Polish audio content for language learning.

## LEARNING OBJECTIVE:
Generate a short Polish audio script (15-30 seconds when spoken) that teaches the target concept through natural context, allowing learners to identify it through comprehension.

## TARGET CONCEPT:
**Word/Concept**: {targetWord}
**Difficulty Level**: {difficulty}
**Learning Goal**: Help learners recognize and understand this concept in spoken Polish

## CONTENT REQUIREMENTS:
- **Length**: 2-4 short sentences maximum
- **Language**: Natural, clear Polish at {difficulty} level
- **Context**: Place the concept in an everyday situation learners can relate to
- **Clarity**: Use simple vocabulary around the target concept
- **Pronunciation**: Choose words that are easy to pronounce clearly
- **Cultural Authenticity**: Include appropriate Polish cultural elements when relevant

## EDUCATIONAL DESIGN:
- **Contextual Learning**: Show the concept being used naturally, not explained
- **Comprehension Cues**: Provide environmental clues that help identify the concept
- **Repetition**: Use the target concept 1-2 times naturally in the script
- **Engagement**: Make the scenario interesting and relatable for learners

## QUALITY CRITERIA:
- ✅ Concept is identifiable through context (not direct definition)
- ✅ Natural Polish speech patterns and intonation
- ✅ Appropriate difficulty level vocabulary
- ✅ Clear, unhurried pronunciation guidance
- ✅ Educational value for language learners

## RESPONSE FORMAT:
Return ONLY the Polish audio script content, ready for text-to-speech:

"{polishAudioScript}"

Example for "jabłko" (apple): "W kuchni mama myje świeże jabłka. Potem kroi je na kawałki dla dzieci. Jabłka są bardzo zdrowe!"
Example for "szkoła" (school): "Rano dzieci idą do szkoły z plecakami. Nauczycielka wita wszystkich w klasie. Uczniowie otwierają książki."`;

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
    // Create a focused, simple prompt for educational illustration
    const contextHint = conceptContext && conceptContext.length > 100
      ? conceptContext.substring(0, 100) + "..."
      : conceptContext || "typical usage context";

    return IMAGE_GENERATION_PROMPT
      .replace("{targetWord}", targetWord)
      .replace("{difficulty}", "A1-B2") // Default educational range
      .replace("{conceptContext}", contextHint);
  }

  static buildAudioPrompt(
    targetWord: string,
    analysis: ContentAnalysis,
    difficulty: QuestionLevel,
    conceptContext?: string
  ): string {
    // Use a simple, focused approach for audio generation
    const contextHint = conceptContext && conceptContext.length > 50
      ? conceptContext.substring(0, 50) + "..."
      : conceptContext || "common everyday usage";

    return AUDIO_GENERATION_PROMPT
      .replace("{targetWord}", targetWord)
      .replace("{difficulty}", difficulty)
      .replace("{conceptContext}", contextHint);
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
