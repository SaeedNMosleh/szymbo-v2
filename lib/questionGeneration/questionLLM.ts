import { QuestionType, QuestionLevel } from "@/lib/enum";
import { IConcept } from "@/datamodels/concept.model";
import { LLMServiceFactory } from "@/lib/services/llm/llmServiceFactory";
import { 
  sanitizeAndParseJSON, 
  validateQuestionResponse, 
  logJSONParsingError,
  extractPartialJSON 
} from "./jsonUtils";
import {
  DIFFICULTY_GUIDELINES,
  QUESTION_TYPE_PROMPTS,
  QUESTION_GENERATION_BASE_PROMPT,
  CONJUGATION_SPECIAL_REQUIREMENTS,
  QUESTION_REGENERATION_BASE_PROMPT
} from "@/prompts/questionGeneration";

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
        if (partialData && typeof partialData === 'object' && 'questions' in partialData && Array.isArray(partialData.questions)) {
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

      const questionData = parseResult.data as { questions?: unknown[] };
      return this.validateAndFormatQuestions(questionData.questions || [], request);
      
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
    const typeInfo = QUESTION_TYPE_PROMPTS[questionType];
    const conceptNames = concepts.map(c => c.name).join(", ");
    const conceptDescriptions = concepts.map(c => `${c.name}: ${c.description}`).join("\n");
    
    return QUESTION_GENERATION_BASE_PROMPT
      .replace('{questionType}', questionType)
      .replace('{quantity}', quantity.toString())
      .replace('{typeDescription}', typeInfo.description)
      .replace('{typeTemplate}', typeInfo.template)
      .replace('{typeExample}', typeInfo.example)
      .replace('{conceptNames}', conceptNames)
      .replace('{conceptDescriptions}', conceptDescriptions)
      .replace('{difficulty}', difficulty)
      .replace('{difficultyGuidelines}', this.getDifficultyGuidelines(difficulty))
      .replace('{specialInstructions}', specialInstructions ? `SPECIAL INSTRUCTIONS: ${specialInstructions}` : '')
      .replace('{conjugationSpecialRequirements}', questionType === QuestionType.CONJUGATION_TABLE ? CONJUGATION_SPECIAL_REQUIREMENTS : '')
      .replace('{exampleConceptName}', conceptNames.split(', ')[0] || 'verb conjugation')
      .replace(/\{quantity\}/g, quantity.toString());
  }

  private getDifficultyGuidelines(difficulty: QuestionLevel): string {
    return DIFFICULTY_GUIDELINES[difficulty] || DIFFICULTY_GUIDELINES[QuestionLevel.A1];
  }

  private validateAndFormatQuestions(
    questions: unknown[], 
    request: QuestionGenerationRequest
  ): GeneratedQuestion[] {
    const validQuestions: GeneratedQuestion[] = [];
    const conceptIds = request.concepts.map(c => c.id);
    
    // Create mapping from concept names to IDs (LLM uses names, we need IDs for storage)
    const conceptNameToIdMap = new Map(request.concepts.map(c => [c.name, c.id]));

    for (const q of questions) {
      const question = q as { question?: string; correctAnswer?: string; targetConcepts?: unknown[]; options?: string[] };
      
      if (!question.question || !question.correctAnswer) {
        console.warn("Skipping invalid question:", q);
        continue;
      }

      // Convert LLM-provided concept names to concept IDs for database storage
      let targetConceptIds: string[] = conceptIds; // Default to all concept IDs
      
      if (question.targetConcepts && Array.isArray(question.targetConcepts) && question.targetConcepts.length > 0) {
        // Convert concept names from LLM to concept IDs for internal storage
        targetConceptIds = question.targetConcepts
          .map((conceptName: unknown) => conceptNameToIdMap.get(conceptName as string))
          .filter((id: string | undefined) => id !== undefined) as string[];
        
        // If no valid concepts found after mapping, fallback to all concept IDs
        if (targetConceptIds.length === 0) {
          targetConceptIds = conceptIds;
        }
      }

      console.log(`LLM returned concept names: ${JSON.stringify(question.targetConcepts)}, storing as IDs: ${JSON.stringify(targetConceptIds)}`);

      const formattedQuestion: GeneratedQuestion = {
        question: question.question.trim(),
        correctAnswer: question.correctAnswer.trim(),
        questionType: request.questionType,
        difficulty: request.difficulty,
        targetConcepts: targetConceptIds, // Always concept IDs for database storage
        options: question.options || undefined,
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

      const rawResponse = response.data || '';
      
      // Use sanitization utility to parse JSON
      const parseResult = sanitizeAndParseJSON(rawResponse);
      
      if (!parseResult.success) {
        logJSONParsingError(rawResponse, new Error(parseResult.error || 'Unknown parsing error'));
        throw new Error(`Failed to parse regeneration response: ${parseResult.error}`);
      }

      // Extract the question from the response
      const responseData = parseResult.data as { question?: unknown };
      const questionData = responseData.question || parseResult.data;
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
    originalQuestion: GeneratedQuestion,
    concepts: IConcept[],
    specialInstructions?: string
  ): string {
    const questionType = originalQuestion.questionType as QuestionType;
    const typeInfo = QUESTION_TYPE_PROMPTS[questionType];
    const conceptDescriptions = concepts.map(c => `${c.name}: ${c.description}`).join("\n");
    
    return QUESTION_REGENERATION_BASE_PROMPT
      .replace('{originalQuestion}', originalQuestion.question)
      .replace('{originalAnswer}', originalQuestion.correctAnswer)
      .replace('{questionType}', originalQuestion.questionType)
      .replace('{originalOptions}', originalQuestion.options ? `Options: ${originalQuestion.options.join(", ")}` : '')
      .replace('{conceptDescriptions}', conceptDescriptions)
      .replace('{difficulty}', originalQuestion.difficulty.toString())
      .replace('{typeDescription}', typeInfo.description)
      .replace('{typeTemplate}', typeInfo.template)
      .replace('{specialInstructions}', specialInstructions ? `SPECIAL REQUIREMENTS: ${specialInstructions}` : '');
  }
}