import { QuestionType, QuestionLevel } from "@/lib/enum";
import { IConcept } from "@/datamodels/concept.model";
import { LLMServiceFactory } from "@/lib/services/llm/llmServiceFactory";
import { OpenAIService } from "@/lib/services/llm/openAIService";
import {
  sanitizeAndParseJSON,
  validateQuestionResponse,
  logJSONParsingError,
  extractPartialJSON,
} from "./jsonUtils";
import {
  DIFFICULTY_GUIDELINES,
  QUESTION_TYPE_PROMPTS,
  QUESTION_GENERATION_BASE_PROMPT,
  CONJUGATION_SPECIAL_REQUIREMENTS,
  QUESTION_REGENERATION_BASE_PROMPT,
} from "@/prompts/questionGeneration";
import { ContentAnalysisService } from "@/lib/services/contentAnalysisService";
import { MediaPromptBuilder } from "@/prompts/mediaGeneration";

export interface QuestionGenerationRequest {
  concepts: IConcept[];
  questionType: QuestionType;
  difficulty: QuestionLevel;
  quantity: number;
  specialInstructions?: string;
}

export interface GeneratedQuestion {
  question: string;
  correctAnswer: string;
  questionType: QuestionType;
  targetConcepts: string[];
  difficulty: QuestionLevel;
  options?: string[];
  audioUrl?: string;
  imageUrl?: string;
}

export class QuestionLLMService {
  private llmService;
  private openAIService: OpenAIService;
  private contentAnalysisService: ContentAnalysisService;

  constructor() {
    this.llmService = LLMServiceFactory.getOpenAIService();
    this.openAIService = new OpenAIService({
      apiKey: process.env.OPENAI_API_KEY!,
      temperature: 0.7,
      maxTokens: 1000,
    });
    this.contentAnalysisService = new ContentAnalysisService();
  }

  /**
   * Generate sophisticated audio for AUDIO_COMPREHENSION questions with dynamic contextual scenarios
   */
  private async generateAudioForQuestion(
    correctAnswer: string,
    difficulty: QuestionLevel,
    conceptContext?: string
  ): Promise<string> {
    // Use dynamic content analysis instead of hardcoded patterns
    const audioContent = await this.createContextualAudioContent(
      correctAnswer,
      difficulty,
      conceptContext
    );

    // Generate audio using the contextual scenario
    const audioBuffer = await this.openAIService.generateAudio(
      audioContent,
      "alloy"
    );

    // Convert buffer to base64 data URL for immediate use
    const audioBase64 = audioBuffer.toString("base64");
    return `data:audio/mp3;base64,${audioBase64}`;
  }

  /**
   * Creates dynamic contextual audio scenarios using flexible content analysis
   */
  private async createContextualAudioContent(
    targetWord: string,
    difficulty: QuestionLevel,
    conceptContext?: string
  ): Promise<string> {
    try {
      // Use dynamic content analysis instead of hardcoded patterns
      const analysis = await this.contentAnalysisService.analyzeContent(
        targetWord,
        difficulty,
        conceptContext
      );

      // Generate audio content using the analysis
      const audioPrompt = MediaPromptBuilder.buildAudioPrompt(
        targetWord,
        analysis,
        difficulty,
        conceptContext
      );

      // Use LLM to generate contextual Polish content
      const response = await this.llmService.generateResponse({
        prompt: audioPrompt,
        systemPrompt:
          "You are a Polish language expert creating contextual audio content for language learning.",
        temperature: 0.7,
        maxTokens: 500,
      });

      // Check if the response was successful
      if (!response.success || !response.data) {
        throw new Error(`Failed to generate audio content: ${response.error}`);
      }

      const responseText = response.data;

      // Extract the audio content from the response
      const contentMatch = responseText.match(/Content: "([^"]+)"/);
      if (contentMatch && contentMatch[1]) {
        return contentMatch[1];
      }

      // If no proper content extracted, use the response directly but clean it
      const cleanedResponse = responseText
        .replace(/^Content:\s*"?/, "")
        .replace(/"?\s*$/, "")
        .trim();

      return cleanedResponse || this.getFallbackAudioContent(analysis);
    } catch (error) {
      console.error("Error generating dynamic audio content:", error);

      // Use intelligent fallback based on available context
      return this.getFallbackAudioContent(
        undefined,
        targetWord,
        conceptContext
      );
    }
  }

  /**
   * Provides intelligent fallback audio content when dynamic generation fails
   */
  private getFallbackAudioContent(
    analysis?: import("@/prompts/mediaGeneration").ContentAnalysis,
    targetWord?: string,
    conceptContext?: string
  ): string {
    // Try to use concept context if available
    if (conceptContext) {
      const contextParts = conceptContext.split(";").map((part) => part.trim());
      const relevantContext = contextParts.find((part) =>
        targetWord
          ? part.toLowerCase().includes(targetWord.toLowerCase())
          : true
      );

      if (relevantContext) {
        const [concept, description] = relevantContext
          .split(":")
          .map((s) => s.trim());
        if (description) {
          return `${description.replace(concept || "", "___")}.`;
        }
      }
    }

    // Use analysis-based fallback if available
    if (analysis) {
      return this.contentAnalysisService.getFallbackContent(analysis, "audio");
    }

    // Final fallback - general contextual description
    return `Myślę o czymś, co jest bardzo ważne w codziennym życiu. To jest _____.`;
  }

  /**
   * Generate sophisticated image for VISUAL_VOCABULARY questions using dynamic content analysis
   */
  private async generateImageForQuestion(
    correctAnswer: string,
    difficulty: QuestionLevel,
    conceptContext?: string
  ): Promise<string> {
    try {
      // Use dynamic content analysis instead of hardcoded patterns
      const analysis = await this.contentAnalysisService.analyzeContent(
        correctAnswer,
        difficulty,
        conceptContext
      );

      // Create educational prompt using dynamic analysis
      const enhancedPrompt = MediaPromptBuilder.buildImagePrompt(
        correctAnswer,
        analysis,
        conceptContext
      );

      // Call OpenAI service with enhanced prompt
      const imageUrl = await this.openAIService.generateImage(
        enhancedPrompt,
        "1024x1024"
      );

      return imageUrl;
    } catch (error) {
      console.error("Error generating dynamic image:", error);

      // Fallback to basic contextual image generation
      const fallbackPrompt = this.createFallbackImagePrompt(
        correctAnswer,
        conceptContext
      );
      const imageUrl = await this.openAIService.generateImage(
        fallbackPrompt,
        "1024x1024"
      );

      return imageUrl;
    }
  }

  /**
   * Creates fallback image prompt when dynamic analysis fails
   */
  private createFallbackImagePrompt(
    polishWord: string,
    conceptContext?: string
  ): string {
    // Enhanced context from concept information
    let contextualEnhancements = "";
    if (conceptContext) {
      const contextParts = conceptContext.split(";").map((part) => part.trim());
      const relevantContext = contextParts.find(
        (part) =>
          part.toLowerCase().includes(polishWord.toLowerCase()) ||
          polishWord
            .toLowerCase()
            .includes(part.split(":")[0]?.toLowerCase() || "")
      );

      if (relevantContext) {
        const [, description] = relevantContext.split(":").map((s) => s.trim());
        if (description) {
          contextualEnhancements = `\n- Additional Context: ${description}`;
        }
      }
    }

    const prompt = `Educational Polish language learning illustration:

OBJECTIVE: Create a visual scene that allows learners to identify the target concept through contextual understanding and visual cues, without showing any text or revealing the answer directly.

SCENE COMPOSITION:
- Setting: Everyday Polish life context where this concept would naturally appear
- Visual Elements: People interacting with or using this concept in realistic situations
- Cultural Context: Polish cultural context that helps learners understand the concept's usage

EDUCATIONAL REQUIREMENTS:
- NO visible text, words, letters, or labels anywhere in the image
- Show the concept through its natural context and usage
- Include environmental cues that aid comprehension
- Use visual storytelling to convey meaning
- Make the target concept identifiable through situation and context

VISUAL STYLE:
- Clear, professional illustration style
- Bright, engaging colors suitable for educational content
- Clean composition with high contrast
- Cartoon/illustration style rather than photorealistic
- Appropriate for international learners of all cultural backgrounds

SCENE DETAILS:
- Include realistic props and environmental elements
- Show typical usage context or natural environment
- Add cultural elements that enhance Polish language learning
- Ensure visual clarity for educational assessment${contextualEnhancements}

Remember: Students will see this image and need to identify what Polish word it represents through visual context alone.`;

    return prompt;
  }

  async generateQuestions(
    request: QuestionGenerationRequest
  ): Promise<GeneratedQuestion[]> {
    const {
      concepts,
      questionType,
      difficulty,
      quantity,
      specialInstructions,
    } = request;

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(
          `Question generation attempt ${attempt + 1}/${maxRetries} for ${questionType}`
        );

        const prompt = this.buildGenerationPrompt(
          concepts,
          questionType,
          difficulty,
          quantity,
          specialInstructions
        );

        return await this.attemptQuestionGeneration(prompt, request);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        console.warn(`Attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < maxRetries - 1) {
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1))
          );
        }
      }
    }

    throw new Error(
      `Failed to generate questions after ${maxRetries} attempts: ${lastError?.message}`
    );
  }

  private async attemptQuestionGeneration(
    prompt: string,
    request: QuestionGenerationRequest
  ): Promise<GeneratedQuestion[]> {
    try {
      const response = await this.llmService.generateResponse({
        prompt,
        temperature: 0.7,
        maxTokens: 2000,
      });

      const rawResponse = response.data || "";
      console.log(
        "Raw LLM response for debugging:",
        rawResponse.substring(0, 500)
      );

      // Use sanitization utility to parse JSON
      const parseResult = sanitizeAndParseJSON(rawResponse);

      if (!parseResult.success) {
        logJSONParsingError(
          rawResponse,
          new Error(parseResult.error || "Unknown parsing error")
        );

        // Try to extract partial JSON as fallback
        const partialData = extractPartialJSON(rawResponse);
        if (
          partialData &&
          typeof partialData === "object" &&
          "questions" in partialData &&
          Array.isArray(partialData.questions)
        ) {
          console.warn("Using partial JSON extraction as fallback");
          return await this.validateAndFormatQuestions(
            partialData.questions,
            request
          );
        }

        throw new Error(`Failed to parse LLM response: ${parseResult.error}`);
      }

      // Validate the parsed response structure
      if (!validateQuestionResponse(parseResult.data)) {
        console.error("Invalid question response structure:", parseResult.data);
        throw new Error("LLM returned invalid question structure");
      }

      const questionData = parseResult.data as { questions?: unknown[] };
      return await this.validateAndFormatQuestions(
        questionData.questions || [],
        request
      );
    } catch (error) {
      console.error("Error generating questions:", error);
      if (error instanceof Error && error.message.includes("parse")) {
        throw new Error(`JSON parsing failed: ${error.message}`);
      }
      throw new Error("Failed to generate questions with AI service");
    }
  }

  private buildGenerationPrompt(
    concepts: IConcept[],
    questionType: QuestionType,
    difficulty: QuestionLevel,
    quantity: number,
    specialInstructions?: string
  ): string {
    const typeInfo = QUESTION_TYPE_PROMPTS[questionType];
    const conceptNames = concepts.map((c) => c.name).join(", ");
    const conceptDescriptions = concepts
      .map((c) => `${c.name}: ${c.description}`)
      .join("\n");

    return QUESTION_GENERATION_BASE_PROMPT.replace(
      "{questionType}",
      questionType
    )
      .replace("{quantity}", quantity.toString())
      .replace("{typeDescription}", typeInfo.description)
      .replace("{typeTemplate}", typeInfo.template)
      .replace("{typeExample}", typeInfo.example)
      .replace("{conceptNames}", conceptNames)
      .replace("{conceptDescriptions}", conceptDescriptions)
      .replace("{difficulty}", difficulty)
      .replace(
        "{difficultyGuidelines}",
        this.getDifficultyGuidelines(difficulty)
      )
      .replace(
        "{specialInstructions}",
        specialInstructions
          ? `SPECIAL INSTRUCTIONS: ${specialInstructions}`
          : ""
      )
      .replace(
        "{conjugationSpecialRequirements}",
        questionType === QuestionType.CONJUGATION_TABLE
          ? CONJUGATION_SPECIAL_REQUIREMENTS
          : ""
      )
      .replace(
        "{exampleConceptName}",
        conceptNames.split(", ")[0] || "verb conjugation"
      )
      .replace(/\{quantity\}/g, quantity.toString());
  }

  private getDifficultyGuidelines(difficulty: QuestionLevel): string {
    return (
      DIFFICULTY_GUIDELINES[difficulty] ||
      DIFFICULTY_GUIDELINES[QuestionLevel.A1]
    );
  }

  private async validateAndFormatQuestions(
    questions: unknown[],
    request: QuestionGenerationRequest
  ): Promise<GeneratedQuestion[]> {
    const validQuestions: GeneratedQuestion[] = [];
    const conceptIds = request.concepts.map((c) => c.id);

    // Create mapping from concept names to IDs (LLM uses names, we need IDs for storage)
    const conceptNameToIdMap = new Map(
      request.concepts.map((c) => [c.name, c.id])
    );

    for (const q of questions) {
      const question = q as {
        question?: string;
        correctAnswer?: string;
        targetConcepts?: unknown[];
        options?: string[];
      };

      if (!question.question || !question.correctAnswer) {
        console.warn("Skipping invalid question:", q);
        continue;
      }

      // Convert LLM-provided concept names to concept IDs for database storage
      let targetConceptIds: string[] = conceptIds; // Default to all concept IDs

      if (
        question.targetConcepts &&
        Array.isArray(question.targetConcepts) &&
        question.targetConcepts.length > 0
      ) {
        // Convert concept names from LLM to concept IDs for internal storage
        targetConceptIds = question.targetConcepts
          .map((conceptName: unknown) =>
            conceptNameToIdMap.get(conceptName as string)
          )
          .filter((id: string | undefined) => id !== undefined) as string[];

        // If no valid concepts found after mapping, fallback to all concept IDs
        if (targetConceptIds.length === 0) {
          targetConceptIds = conceptIds;
        }
      }

      console.log(
        `LLM returned concept names: ${JSON.stringify(question.targetConcepts)}, storing as IDs: ${JSON.stringify(targetConceptIds)}`
      );

      const formattedQuestion: GeneratedQuestion = {
        question: question.question.trim(),
        correctAnswer: question.correctAnswer.trim(),
        questionType: request.questionType,
        difficulty: request.difficulty,
        targetConcepts: targetConceptIds, // Always concept IDs for database storage
        options: question.options || undefined,
      };

      // Validate question type specific requirements
      if (
        this.isValidQuestionForType(formattedQuestion, request.questionType)
      ) {
        // Generate media for specific question types with concept context
        await this.generateMediaForQuestion(
          formattedQuestion,
          request.concepts
        );
        validQuestions.push(formattedQuestion);
      }
    }

    return validQuestions;
  }

  /**
   * Generate appropriate media for questions that require it with rich concept context
   * FAILS if media generation fails - no fallbacks for incomplete questions
   */
  private async generateMediaForQuestion(
    question: GeneratedQuestion,
    concepts?: IConcept[]
  ): Promise<void> {
    // Build concept context for media generation
    const conceptContext = concepts
      ? concepts.map((c) => `${c.name}: ${c.description}`).join("; ")
      : undefined;

    switch (question.questionType) {
      case QuestionType.AUDIO_COMPREHENSION: {
        console.log(
          "Generating contextual audio for AUDIO_COMPREHENSION question"
        );
        // MUST succeed - audio is required for this question type
        const audioUrl = await this.generateAudioForQuestion(
          question.correctAnswer,
          question.difficulty,
          conceptContext
        );
        question.audioUrl = audioUrl;
        console.log("Contextual audio generated successfully");
        break;
      }

      case QuestionType.VISUAL_VOCABULARY: {
        console.log(
          "Generating contextual image for VISUAL_VOCABULARY question"
        );
        // MUST succeed - image is required for this question type
        const imageUrl = await this.generateImageForQuestion(
          question.correctAnswer,
          question.difficulty,
          conceptContext
        );
        question.imageUrl = imageUrl;
        console.log("Contextual image generated successfully");
        break;
      }

      default:
        // No media generation needed for other question types
        break;
    }
  }

  private isValidQuestionForType(
    question: GeneratedQuestion,
    type: QuestionType
  ): boolean {
    switch (type) {
      case QuestionType.VOCAB_CHOICE:
      case QuestionType.MULTI_SELECT:
        return !!(question.options && question.options.length >= 2);

      case QuestionType.BASIC_CLOZE:
      case QuestionType.MULTI_CLOZE:
        return question.question.includes("_____");

      case QuestionType.WORD_ARRANGEMENT:
        return !!(question.options && question.options.length >= 3);

      default:
        return true;
    }
  }

  async regenerateQuestion(
    originalQuestion: GeneratedQuestion,
    concepts: IConcept[],
    specialInstructions?: string
  ): Promise<GeneratedQuestion> {
    const regenerationPrompt = this.buildRegenerationPrompt(
      originalQuestion,
      concepts,
      specialInstructions
    );

    try {
      const response = await this.llmService.generateResponse({
        prompt: regenerationPrompt,
        temperature: 0.8, // Higher temperature for more variation
        maxTokens: 1000,
      });

      const rawResponse = response.data || "";

      // Use sanitization utility to parse JSON
      const parseResult = sanitizeAndParseJSON(rawResponse);

      if (!parseResult.success) {
        logJSONParsingError(
          rawResponse,
          new Error(parseResult.error || "Unknown parsing error")
        );
        throw new Error(
          `Failed to parse regeneration response: ${parseResult.error}`
        );
      }

      // Extract the question from the response
      const responseData = parseResult.data as { question?: unknown };
      const questionData = responseData.question || parseResult.data;
      const questions = await this.validateAndFormatQuestions([questionData], {
        concepts,
        questionType: originalQuestion.questionType,
        difficulty: originalQuestion.difficulty,
        quantity: 1,
      });

      if (questions.length === 0) {
        throw new Error("Failed to generate valid replacement question");
      }

      return questions[0];
    } catch (error) {
      console.error("Error regenerating question:", error);
      throw new Error("Failed to regenerate question");
    }
  }

  private buildRegenerationPrompt(
    originalQuestion: GeneratedQuestion,
    concepts: IConcept[],
    specialInstructions?: string
  ): string {
    const questionType = originalQuestion.questionType as QuestionType;
    const typeInfo = QUESTION_TYPE_PROMPTS[questionType];
    const conceptDescriptions = concepts
      .map((c) => `${c.name}: ${c.description}`)
      .join("\n");

    return QUESTION_REGENERATION_BASE_PROMPT.replace(
      "{originalQuestion}",
      originalQuestion.question
    )
      .replace("{originalAnswer}", originalQuestion.correctAnswer)
      .replace("{questionType}", originalQuestion.questionType)
      .replace(
        "{originalOptions}",
        originalQuestion.options
          ? `Options: ${originalQuestion.options.join(", ")}`
          : ""
      )
      .replace("{conceptDescriptions}", conceptDescriptions)
      .replace("{difficulty}", originalQuestion.difficulty.toString())
      .replace("{typeDescription}", typeInfo.description)
      .replace("{typeTemplate}", typeInfo.template)
      .replace(
        "{specialInstructions}",
        specialInstructions
          ? `SPECIAL REQUIREMENTS: ${specialInstructions}`
          : ""
      );
  }
}
