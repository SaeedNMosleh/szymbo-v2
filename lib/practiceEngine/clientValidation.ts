import { QuestionType } from "@/lib/enum";

export interface ValidationResult {
  isCorrect: boolean;
  feedback: string;
  correctAnswer: string;
  confidence: number; // 0-1
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
  correctAnswer: string
): ValidationResult {
  switch (questionType) {
    case QuestionType.VOCAB_CHOICE:
    case QuestionType.VISUAL_VOCABULARY:
    case QuestionType.AUDIO_COMPREHENSION:
      return validateSingleChoice(userAnswer as string, correctAnswer);

    case QuestionType.MULTI_SELECT:
      return validateMultiSelect(userAnswer as string[], correctAnswer);

    case QuestionType.CONJUGATION_TABLE:
    case QuestionType.ASPECT_PAIRS:
    case QuestionType.DIMINUTIVE_FORMS:
      return validateExactMatch(userAnswer as string, correctAnswer);

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
  correctAnswer: string
): ValidationResult {
  const isCorrect =
    userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

  return {
    isCorrect,
    feedback: isCorrect
      ? "Correct! Well done."
      : `Incorrect. The correct answer is: ${correctAnswer}`,
    correctAnswer,
    confidence: 1.0, // Deterministic
  };
}

/**
 * Validate multi-select questions (checkbox selection)
 */
function validateMultiSelect(
  userAnswers: string[],
  correctAnswer: string
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

  const feedback = isCorrect
    ? "Correct! You selected all the right options."
    : `Incorrect. The correct answers are: ${correctAnswers.join(", ")}`;

  return {
    isCorrect,
    feedback,
    correctAnswer: correctAnswers.join(", "),
    confidence: 1.0,
  };
}

/**
 * Validate exact match questions (for structured answers)
 */
function validateExactMatch(
  userAnswer: string,
  correctAnswer: string
): ValidationResult {
  // Normalize whitespace and case for comparison
  const normalizedUser = userAnswer.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();

  const isCorrect = normalizedUser === normalizedCorrect;

  return {
    isCorrect,
    feedback: isCorrect
      ? "Perfect! Exact match."
      : `Incorrect. The correct answer is: ${correctAnswer}`,
    correctAnswer,
    confidence: 1.0,
  };
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
