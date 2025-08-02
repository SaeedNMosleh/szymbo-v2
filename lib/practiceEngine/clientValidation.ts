import { QuestionType } from "@/lib/enum";
import type { ICourse } from "@/datamodels/course.model";

export interface ValidationResult {
  isCorrect: boolean;
  feedback: string;
  correctAnswer: string; // Immutable - always the stored correct answer
  confidence: number; // 0-1
}

export interface UnifiedValidationInput {
  questionType: QuestionType;
  userAnswer: string | string[];
  correctAnswer: string; // Immutable reference answer
  question?: string; // For LLM context
  attemptNumber?: number; // For progressive hints
}

export interface LLMValidationContext {
  question: string;
  userAnswer: string;
  correctAnswer: string; // Immutable - LLM cannot modify this
  attemptNumber: number;
  courseContext?: ICourse;
}

/**
 * Question types that can be validated on the client side (deterministic answers)
 */
export const CLIENT_VALIDATED_TYPES = new Set([
  QuestionType.VOCAB_CHOICE,
  QuestionType.MULTI_SELECT,
  QuestionType.VISUAL_VOCABULARY,
  QuestionType.AUDIO_COMPREHENSION,
  QuestionType.CONJUGATION_TABLE,
  QuestionType.ASPECT_PAIRS,
  QuestionType.DIMINUTIVE_FORMS,
]);

/**
 * Question types that require LLM validation (open-ended, subjective answers)
 */
export const LLM_VALIDATED_TYPES = new Set([
  QuestionType.BASIC_CLOZE,
  QuestionType.MULTI_CLOZE,
  QuestionType.CASE_TRANSFORM,
  QuestionType.SENTENCE_TRANSFORM,
  QuestionType.WORD_ARRANGEMENT,
  QuestionType.TRANSLATION_PL,
  QuestionType.TRANSLATION_EN,
  QuestionType.DIALOGUE_COMPLETE,
  QuestionType.SCENARIO_RESPONSE,
  QuestionType.CULTURAL_CONTEXT,
  QuestionType.Q_A,
]);

/**
 * Determines if a question type should use client-side validation
 */
export function shouldUseClientValidation(questionType: QuestionType): boolean {
  return CLIENT_VALIDATED_TYPES.has(questionType);
}

/**
 * Client-side validation for deterministic question types
 */
export function validateAnswerClientSide(
  questionType: QuestionType,
  userAnswer: string | string[],
  correctAnswer: string,
  attemptNumber: number = 1
): ValidationResult {
  switch (questionType) {
    case QuestionType.VOCAB_CHOICE:
    case QuestionType.VISUAL_VOCABULARY:
    case QuestionType.AUDIO_COMPREHENSION:
      return validateSingleChoice(userAnswer as string, correctAnswer, attemptNumber);

    case QuestionType.MULTI_SELECT:
      return validateMultiSelect(userAnswer as string[], correctAnswer, attemptNumber);

    case QuestionType.CONJUGATION_TABLE:
      return validateConjugationTable(userAnswer as string[], correctAnswer, attemptNumber);
      
    case QuestionType.ASPECT_PAIRS:
    case QuestionType.DIMINUTIVE_FORMS:
      return validateExactMatch(userAnswer as string, correctAnswer, attemptNumber);

    default:
      throw new Error(
        `Client validation not supported for question type: ${questionType}`
      );
  }
}

/**
 * Validate single choice questions (radio button selection)
 */
function validateSingleChoice(
  userAnswer: string,
  correctAnswer: string,
  attemptNumber: number
): ValidationResult {
  const isCorrect =
    userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

  let feedback: string;
  if (isCorrect) {
    feedback = "Correct! Well done.";
  } else if (attemptNumber < 3) {
    feedback = "That's not correct. Try again and consider all the options carefully.";
  } else {
    feedback = `Incorrect. The correct answer is: ${correctAnswer}`;
  }

  return {
    isCorrect,
    feedback,
    correctAnswer: attemptNumber >= 3 ? correctAnswer : "", // Only reveal answer on attempt 3
    confidence: 1.0, // Deterministic
  };
}

/**
 * Validate multi-select questions (checkbox selection)
 */
function validateMultiSelect(
  userAnswers: string[],
  correctAnswer: string,
  attemptNumber: number
): ValidationResult {
  // Parse correct answers (comma-separated or array)
  const correctAnswers = Array.isArray(correctAnswer)
    ? correctAnswer
    : correctAnswer.split(",").map((ans) => ans.trim());

  // Normalize answers for comparison
  const normalizedUserAnswers = userAnswers
    .map((ans) => ans.trim().toLowerCase())
    .sort();
  const normalizedCorrectAnswers = correctAnswers
    .map((ans) => ans.trim().toLowerCase())
    .sort();

  // Check if arrays are equal
  const isCorrect =
    normalizedUserAnswers.length === normalizedCorrectAnswers.length &&
    normalizedUserAnswers.every(
      (ans, index) => ans === normalizedCorrectAnswers[index]
    );

  let feedback: string;
  if (isCorrect) {
    feedback = "Correct! You selected all the right options.";
  } else if (attemptNumber < 3) {
    const correctCount = correctAnswers.length;
    const userCount = userAnswers.length;
    if (userCount < correctCount) {
      feedback = `You need to select ${correctCount} options. You selected ${userCount}. Try again.`;
    } else if (userCount > correctCount) {
      feedback = `You selected too many options. Only ${correctCount} are correct. Try again.`;
    } else {
      feedback = `You selected the right number of options (${correctCount}), but some are incorrect. Try again.`;
    }
  } else {
    feedback = `Incorrect. The correct answers are: ${correctAnswers.join(", ")}`;
  }

  return {
    isCorrect,
    feedback,
    correctAnswer: attemptNumber >= 3 ? correctAnswers.join(", ") : "", // Only reveal answer on attempt 3
    confidence: 1.0,
  };
}

/**
 * Validate conjugation table questions (array of 6 verb forms)
 */
function validateConjugationTable(
  userAnswers: string[],
  correctAnswer: string,
  attemptNumber: number
): ValidationResult {
  // Parse correct answers (comma-separated string)
  const correctAnswers = correctAnswer.split(",").map((ans) => ans.trim());
  
  // Ensure we have exactly 6 forms
  if (correctAnswers.length !== 6) {
    throw new Error("Conjugation table must have exactly 6 forms");
  }
  
  if (userAnswers.length !== 6) {
    return {
      isCorrect: false,
      feedback: "Please fill in all 6 conjugation forms.",
      correctAnswer: attemptNumber >= 3 ? correctAnswer : "", // Only reveal answer on attempt 3
      confidence: 1.0,
    };
  }

  // Normalize and compare each form
  const normalizedUserAnswers = userAnswers.map((ans) => ans.trim().toLowerCase());
  const normalizedCorrectAnswers = correctAnswers.map((ans) => ans.trim().toLowerCase());
  
  // Check each form
  const incorrectForms: number[] = [];
  for (let i = 0; i < 6; i++) {
    if (normalizedUserAnswers[i] !== normalizedCorrectAnswers[i]) {
      incorrectForms.push(i + 1);
    }
  }
  
  const isCorrect = incorrectForms.length === 0;
  const formLabels = ["ja", "ty", "on/ona/ono", "my", "wy", "oni/one"];
  
  let feedback: string;
  if (isCorrect) {
    feedback = "Perfect! All conjugation forms are correct.";
  } else if (attemptNumber < 3) {
    if (incorrectForms.length === 1) {
      const formIndex = incorrectForms[0] - 1;
      feedback = `Almost there! Check the ${formLabels[formIndex]} form.`;
    } else if (incorrectForms.length <= 3) {
      feedback = `Check these forms: ${incorrectForms.map(i => formLabels[i-1]).join(", ")}. Try again.`;
    } else {
      feedback = "Several forms need correction. Review the conjugation pattern and try again.";
    }
  } else {
    // Attempt 3: Show correct answers
    if (incorrectForms.length === 1) {
      const formIndex = incorrectForms[0] - 1;
      feedback = `Almost there! Check the ${formLabels[formIndex]} form: ${correctAnswers[formIndex]}`;
    } else {
      feedback = `Check these forms: ${incorrectForms.map(i => formLabels[i-1]).join(", ")}. Correct answers: ${correctAnswers.join(", ")}`;
    }
  }

  return {
    isCorrect,
    feedback,
    correctAnswer: attemptNumber >= 3 ? correctAnswer : "", // Only reveal answer on attempt 3
    confidence: 1.0,
  };
}

/**
 * Validate exact match questions (for structured answers)
 */
function validateExactMatch(
  userAnswer: string,
  correctAnswer: string,
  attemptNumber: number
): ValidationResult {
  // Normalize whitespace and case for comparison
  const normalizedUser = userAnswer.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();

  const isCorrect = normalizedUser === normalizedCorrect;

  let feedback: string;
  if (isCorrect) {
    feedback = "Perfect! Exact match.";
  } else if (attemptNumber < 3) {
    feedback = "Not quite right. Check your spelling and try again.";
  } else {
    feedback = `Incorrect. The correct answer is: ${correctAnswer}`;
  }

  return {
    isCorrect,
    feedback,
    correctAnswer: attemptNumber >= 3 ? correctAnswer : "", // Only reveal answer on attempt 3
    confidence: 1.0,
  };
}

/**
 * Unified validation function that routes to appropriate validation method
 * Ensures correctAnswer is never modified during validation
 */
export async function validateQuestionAnswer(
  input: UnifiedValidationInput,
  courseContext?: ICourse
): Promise<ValidationResult> {
  if (shouldUseClientValidation(input.questionType)) {
    // Use deterministic client-side validation
    return validateAnswerClientSide(
      input.questionType,
      input.userAnswer,
      input.correctAnswer,
      input.attemptNumber || 1
    );
  } else {
    // Use LLM validation with immutable correctAnswer
    const { validateAnswerWithLLM } = await import("@/lib/LLMPracticeValidation/validateAnswer");
    
    const llmContext: LLMValidationContext = {
      question: input.question || "",
      userAnswer: Array.isArray(input.userAnswer) ? input.userAnswer.join(", ") : input.userAnswer,
      correctAnswer: input.correctAnswer, // Immutable reference
      attemptNumber: input.attemptNumber || 1,
      courseContext,
    };
    
    return await validateAnswerWithLLM(llmContext);
  }
}

/**
 * Get human-readable feedback for validation method
 */
export function getValidationMethodInfo(questionType: QuestionType): {
  method: "client" | "llm";
  reason: string;
} {
  if (shouldUseClientValidation(questionType)) {
    return {
      method: "client",
      reason: "Deterministic answer with predefined correct options",
    };
  } else {
    return {
      method: "llm",
      reason: "Open-ended answer requiring contextual evaluation",
    };
  }
}
