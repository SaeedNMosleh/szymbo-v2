import { QuestionType, QuestionLevel } from "@/lib/enum";
import { IConcept } from "@/datamodels/concept.model";
import { LLMServiceFactory } from "@/lib/services/llm/llmServiceFactory";
import { 
  sanitizeAndParseJSON, 
  validateQuestionResponse, 
  logJSONParsingError,
  extractPartialJSON 
} from "./jsonUtils";

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

const questionTypePrompts: Record<QuestionType, { description: string; template: string; example: string }> = {
  [QuestionType.BASIC_CLOZE]: {
    description: "Fill-in-the-blank questions with single word answers",
    template: "Create a sentence with a missing word (use _____ for the blank). The missing word should test the concept.",
    example: "Question: 'Ja _____ do sklepu.' Answer: 'idę'"
  },
  [QuestionType.MULTI_CLOZE]: {
    description: "Fill-in-the-blank questions with multiple missing words",
    template: "Create a sentence with 2-3 missing words (use _____ for each blank). Each blank tests related concepts.",
    example: "Question: 'Moja _____ _____ do pracy autobusem.' Answer: 'siostra jedzie'"
  },
  [QuestionType.VOCAB_CHOICE]: {
    description: "Multiple choice vocabulary questions",
    template: "Create a multiple choice question with 4 options. Only one option should be correct.",
    example: "Question: 'What does \"książka\" mean?' Options: ['book', 'table', 'chair', 'window'] Answer: 'book'"
  },
  [QuestionType.MULTI_SELECT]: {
    description: "Multiple choice questions with multiple correct answers",
    template: "Create a question where multiple options are correct. Provide 4-6 options with 2-3 correct answers.",
    example: "Question: 'Which are Polish cities?' Options: ['Warszawa', 'Berlin', 'Kraków', 'Paris', 'Gdańsk'] Answer: 'Warszawa,Kraków,Gdańsk'"
  },
  [QuestionType.CONJUGATION_TABLE]: {
    description: "Verb conjugation in specific tense/person",
    template: "Ask for specific verb conjugation form.",
    example: "Question: 'Conjugate \"mówić\" for 3rd person singular present' Answer: 'mówi'"
  },
  [QuestionType.CASE_TRANSFORM]: {
    description: "Questions about grammatical case transformations",
    template: "Give a word and ask for its transformation into a specific grammatical case.",
    example: "Question: 'Transform \"kot\" to accusative case' Answer: 'kota'"
  },
  [QuestionType.SENTENCE_TRANSFORM]: {
    description: "Transform sentences between different grammatical forms",
    template: "Ask to transform sentences (e.g., affirmative to negative, present to past).",
    example: "Question: 'Transform to past tense: Ja czytam książkę' Answer: 'Ja czytałem książkę'"
  },
  [QuestionType.WORD_ARRANGEMENT]: {
    description: "Arrange words to form correct sentence",
    template: "Provide scrambled words that need to be arranged into correct Polish sentence order.",
    example: "Question: 'Arrange: [\"książkę\", \"czytam\", \"ciekawą\"]' Answer: 'Czytam ciekawą książkę'"
  },
  [QuestionType.TRANSLATION_PL]: {
    description: "Translate from English to Polish",
    template: "Provide an English phrase and ask for Polish translation.",
    example: "Question: 'Translate: I am reading a book' Answer: 'Czytam książkę'"
  },
  [QuestionType.TRANSLATION_EN]: {
    description: "Translate from Polish to English",
    template: "Provide a Polish phrase and ask for English translation.",
    example: "Question: 'Translate: Lubię kawę' Answer: 'I like coffee'"
  },
  [QuestionType.AUDIO_COMPREHENSION]: {
    description: "Audio-based comprehension questions",
    template: "Create questions about audio content (provide audio URL).",
    example: "Question: 'What did the speaker say?' Answer: 'Dzień dobry'"
  },
  [QuestionType.VISUAL_VOCABULARY]: {
    description: "Image-based vocabulary questions",
    template: "Create questions about images (provide image URL).",
    example: "Question: 'What is shown in the image?' Answer: 'dom'"
  },
  [QuestionType.DIALOGUE_COMPLETE]: {
    description: "Complete dialogue conversations",
    template: "Provide partial dialogue and ask to complete it.",
    example: "Question: 'A: Jak się masz? B: _____' Answer: 'Dobrze, dziękuję'"
  },
  [QuestionType.ASPECT_PAIRS]: {
    description: "Perfective and imperfective verb aspects",
    template: "Ask about verb aspect pairs in Polish.",
    example: "Question: 'Give the perfective form of \"czytać\"' Answer: 'przeczytać'"
  },
  [QuestionType.DIMINUTIVE_FORMS]: {
    description: "Polish diminutive word forms",
    template: "Ask for diminutive forms of nouns.",
    example: "Question: 'Give the diminutive form of \"kot\"' Answer: 'kotek'"
  },
  [QuestionType.SCENARIO_RESPONSE]: {
    description: "Respond to specific scenarios",
    template: "Provide a scenario and ask for appropriate response.",
    example: "Question: 'You enter a shop. What do you say?' Answer: 'Dzień dobry'"
  },
  [QuestionType.CULTURAL_CONTEXT]: {
    description: "Polish culture and context questions",
    template: "Ask about Polish customs, culture, or context.",
    example: "Question: 'When do Poles celebrate name days?' Answer: 'Throughout the year'"
  },
  [QuestionType.Q_A]: {
    description: "Question and answer format",
    template: "Create a question that requires a specific answer related to the concept.",
    example: "Question: 'Co robisz wieczorem?' Answer: 'Czytam książki' (or similar appropriate answer)"
  }
};

export class QuestionLLMService {
  private llmService;

  constructor() {
    this.llmService = LLMServiceFactory.getOpenAIService();
  }

  async generateQuestions(request: QuestionGenerationRequest): Promise<GeneratedQuestion[]> {
    const { concepts, questionType, difficulty, quantity, specialInstructions } = request;
    
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Question generation attempt ${attempt + 1}/${maxRetries} for ${questionType}`);
        
        const prompt = this.buildGenerationPrompt(concepts, questionType, difficulty, quantity, specialInstructions);
        
        return await this.attemptQuestionGeneration(prompt, request);
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Attempt ${attempt + 1} failed:`, lastError.message);
        
        if (attempt < maxRetries - 1) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    throw new Error(`Failed to generate questions after ${maxRetries} attempts: ${lastError?.message}`);
  }

  private async attemptQuestionGeneration(prompt: string, request: QuestionGenerationRequest): Promise<GeneratedQuestion[]> {
    try {
      const response = await this.llmService.generateResponse({
        prompt,
        temperature: 0.7,
        maxTokens: 2000,
      });

      const rawResponse = response.data || '';
      console.log('Raw LLM response for debugging:', rawResponse.substring(0, 500));

      // Use sanitization utility to parse JSON
      const parseResult = sanitizeAndParseJSON(rawResponse);
      
      if (!parseResult.success) {
        logJSONParsingError(rawResponse, new Error(parseResult.error || 'Unknown parsing error'));
        
        // Try to extract partial JSON as fallback
        const partialData = extractPartialJSON(rawResponse);
        if (partialData && partialData.questions) {
          console.warn('Using partial JSON extraction as fallback');
          return this.validateAndFormatQuestions(partialData.questions, request);
        }
        
        throw new Error(`Failed to parse LLM response: ${parseResult.error}`);
      }

      // Validate the parsed response structure
      if (!validateQuestionResponse(parseResult.data)) {
        console.error('Invalid question response structure:', parseResult.data);
        throw new Error('LLM returned invalid question structure');
      }

      return this.validateAndFormatQuestions(parseResult.data.questions || [], request);
      
    } catch (error) {
      console.error("Error generating questions:", error);
      if (error instanceof Error && error.message.includes('parse')) {
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
    const typeInfo = questionTypePrompts[questionType];
    const conceptNames = concepts.map(c => c.name).join(", ");
    const conceptDescriptions = concepts.map(c => `${c.name}: ${c.description}`).join("\n");
    const conceptIds = concepts.map(c => c.id);

    return `You are an expert Polish language teacher creating ${questionType} questions.

TASK: Generate ${quantity} high-quality Polish learning questions.

QUESTION TYPE: ${typeInfo.description}
TEMPLATE: ${typeInfo.template}
EXAMPLE: ${typeInfo.example}

TARGET CONCEPTS: ${conceptNames}
CONCEPT DETAILS:
${conceptDescriptions}

DIFFICULTY LEVEL: ${difficulty}
${this.getDifficultyGuidelines(difficulty)}

${specialInstructions ? `SPECIAL INSTRUCTIONS: ${specialInstructions}` : ''}

REQUIREMENTS:
1. Each question must test at least one of the target concepts
2. Questions should be appropriate for ${difficulty} level learners
3. Ensure variety - avoid repetitive patterns
4. Use authentic Polish language and realistic contexts
5. For multiple choice questions, include plausible distractors
6. For fill-in-the-blank, use contextual clues appropriately
7. In targetConcepts field, use the exact concept NAMES from the list above, not IDs

CRITICAL JSON FORMATTING REQUIREMENTS:
- Return ONLY valid JSON - no markdown, no explanations, no code blocks
- Use DOUBLE QUOTES for all property names and string values
- NO single quotes, NO trailing commas, NO comments
- Ensure all brackets and braces are properly closed

RESPONSE FORMAT (STRICT JSON):
{
  "questions": [
    {
      "question": "Question text with blanks (___) if applicable",
      "correctAnswer": "Correct answer or comma-separated answers for multi-select",
      "targetConcepts": ["concept_name_1", "concept_name_2"],
      "options": ["option1", "option2", "option3", "option4"]
    }
  ]
}

EXAMPLE VALID JSON RESPONSE:
{
  "questions": [
    {
      "question": "Ja _____ do sklepu.",
      "correctAnswer": "idę",
      "targetConcepts": ["${conceptNames.split(', ')[0] || 'verb conjugation'}"],
      "options": []
    }
  ]
}

Generate exactly ${quantity} questions. Return ONLY the JSON object above with no additional text.`;
  }

  private getDifficultyGuidelines(difficulty: QuestionLevel): string {
    const guidelines = {
      [QuestionLevel.A1]: "Use basic vocabulary, simple present tense, common everyday topics",
      [QuestionLevel.A2]: "Include past/future tenses, more vocabulary, basic cases",
      [QuestionLevel.B1]: "Complex sentences, all cases, conditional mood, broader topics",
      [QuestionLevel.B2]: "Advanced grammar, nuanced vocabulary, cultural contexts",
      [QuestionLevel.C1]: "Sophisticated language, idiomatic expressions, complex concepts",
      [QuestionLevel.C2]: "Native-level complexity, literary language, abstract concepts",
      [QuestionLevel.EASY]: "Simplified content, clear contexts, basic structures",
      [QuestionLevel.MEDIUM]: "Moderate complexity, mixed difficulty elements",
      [QuestionLevel.HARD]: "Challenging vocabulary and grammar, complex contexts"
    };
    
    return guidelines[difficulty] || guidelines[QuestionLevel.A1];
  }

  private validateAndFormatQuestions(
    questions: any[], 
    request: QuestionGenerationRequest
  ): GeneratedQuestion[] {
    const validQuestions: GeneratedQuestion[] = [];
    const conceptIds = request.concepts.map(c => c.id);
    
    // Create mapping from concept names to IDs (LLM uses names, we need IDs for storage)
    const conceptNameToIdMap = new Map(request.concepts.map(c => [c.name, c.id]));

    for (const q of questions) {
      if (!q.question || !q.correctAnswer) {
        console.warn("Skipping invalid question:", q);
        continue;
      }

      // Convert LLM-provided concept names to concept IDs for database storage
      let targetConceptIds: string[] = conceptIds; // Default to all concept IDs
      
      if (q.targetConcepts?.length > 0) {
        // Convert concept names from LLM to concept IDs for internal storage
        targetConceptIds = q.targetConcepts
          .map((conceptName: string) => conceptNameToIdMap.get(conceptName))
          .filter((id: string | undefined) => id !== undefined) as string[];
        
        // If no valid concepts found after mapping, fallback to all concept IDs
        if (targetConceptIds.length === 0) {
          targetConceptIds = conceptIds;
        }
      }

      console.log(`LLM returned concept names: ${JSON.stringify(q.targetConcepts)}, storing as IDs: ${JSON.stringify(targetConceptIds)}`);

      const formattedQuestion: GeneratedQuestion = {
        question: q.question.trim(),
        correctAnswer: q.correctAnswer.trim(),
        questionType: request.questionType,
        difficulty: request.difficulty,
        targetConcepts: targetConceptIds, // Always concept IDs for database storage
        options: q.options || undefined,
      };

      // Validate question type specific requirements
      if (this.isValidQuestionForType(formattedQuestion, request.questionType)) {
        validQuestions.push(formattedQuestion);
      }
    }

    return validQuestions;
  }

  private isValidQuestionForType(question: GeneratedQuestion, type: QuestionType): boolean {
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
    originalQuestion: any,
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

      const rawResponse = response.data || '';
      
      // Use sanitization utility to parse JSON
      const parseResult = sanitizeAndParseJSON(rawResponse);
      
      if (!parseResult.success) {
        logJSONParsingError(rawResponse, new Error(parseResult.error || 'Unknown parsing error'));
        throw new Error(`Failed to parse regeneration response: ${parseResult.error}`);
      }

      // Extract the question from the response
      const questionData = parseResult.data.question || parseResult.data;
      const questions = this.validateAndFormatQuestions([questionData], {
        concepts,
        questionType: originalQuestion.questionType,
        difficulty: originalQuestion.difficulty,
        quantity: 1
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
    originalQuestion: any,
    concepts: IConcept[],
    specialInstructions?: string
  ): string {
    const questionType = originalQuestion.questionType as QuestionType;
    const typeInfo = questionTypePrompts[questionType];
    const conceptDescriptions = concepts.map(c => `${c.name}: ${c.description}`).join("\n");

    return `You are regenerating a Polish learning question that needs improvement.

ORIGINAL QUESTION:
Question: ${originalQuestion.question}
Answer: ${originalQuestion.correctAnswer}
Type: ${originalQuestion.questionType}
${originalQuestion.options ? `Options: ${originalQuestion.options.join(", ")}` : ''}

TARGET CONCEPTS:
${conceptDescriptions}

TASK: Create a NEW, DIFFERENT question of the same type testing the same concepts.
- Use different wording, context, or examples
- Maintain the same difficulty level (${originalQuestion.difficulty})
- Follow the same format requirements

${typeInfo.description}
${typeInfo.template}

${specialInstructions ? `SPECIAL REQUIREMENTS: ${specialInstructions}` : ''}

CRITICAL JSON FORMATTING REQUIREMENTS:
- Return ONLY valid JSON - no markdown, no explanations, no code blocks
- Use DOUBLE QUOTES for all property names and string values
- NO single quotes, NO trailing commas, NO comments
- Ensure all brackets and braces are properly closed

RESPONSE FORMAT (STRICT JSON):
{
  "question": {
    "question": "New question text",
    "correctAnswer": "Correct answer",
    "targetConcepts": ["concept_id_1"],
    "options": ["option1", "option2", "option3", "option4"]
  }
}

Return ONLY the JSON object above with no additional text.`;
  }
}