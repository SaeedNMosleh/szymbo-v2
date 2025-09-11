// lib/enum.ts (Updated with PracticeMode)
/**
 * Comprehensive enum definitions for the Polish learning application
 * Includes both existing and new concept-based learning enums
 */

/* eslint-disable no-unused-vars */
export enum QuestionType {
  BASIC_CLOZE = "basic_cloze",
  MULTI_CLOZE = "multi_cloze",
  VOCAB_CHOICE = "vocab_choice",
  MULTI_SELECT = "multi_select",
  CONJUGATION_TABLE = "conjugation_table",
  CASE_TRANSFORM = "case_transform",
  SENTENCE_TRANSFORM = "sentence_transform",
  WORD_ARRANGEMENT = "word_arrangement",
  TRANSLATION_PL = "translation_pl",
  TRANSLATION_EN = "translation_en",
  AUDIO_COMPREHENSION = "audio_comprehension",
  VISUAL_VOCABULARY = "visual_vocabulary",
  DIALOGUE_COMPLETE = "dialogue_complete",
  ASPECT_PAIRS = "aspect_pairs",
  DIMINUTIVE_FORMS = "diminutive_forms",
  SCENARIO_RESPONSE = "scenario_response",
  CULTURAL_CONTEXT = "cultural_context",
  Q_A = "q_and_a",
}

export enum MistakeType {
  TYPO = "typo",
  GRAMMAR = "grammar",
  VOCAB = "vocab",
  WORD_ORDER = "word_order",
  INCOMPLETE_ANSWER = "incomplete_answer",
}

export enum CourseType {
  NEW = "new",
  REVIEW = "review",
  MIXED = "mixed",
}

export enum QuestionLevel {
  A1 = "A1",
  A2 = "A2",
  B1 = "B1",
  B2 = "B2",
  C1 = "C1",
  C2 = "C2",
}
/* eslint-enable no-unused-vars */

/**
 * Concept categories for organizing learning content
 * Grammar: sentence structures, verb conjugations, cases, etc.
 * Vocabulary: word groups, expressions, idioms, themes
 */
/* eslint-disable no-unused-vars */
export enum ConceptCategory {
  GRAMMAR = "grammar",
  VOCABULARY = "vocabulary",
}

/**
 * Practice modes for different learning approaches
 * Normal: Smart concept selection based on SRS algorithm (includes question bank priority)
 * Drill: User-controlled drilling on weak concepts or specific courses
 */
export enum PracticeMode {
  NORMAL = "normal",
  DRILL = "drill",
}

/**
 * Concept extraction workflow status
 * Pending: Course added but concepts not extracted
 * Extracted: LLM extraction finished, awaiting human review
 * In-review: Human review in progress
 * Reviewed: Human review completed, concepts added to DB
 */
export enum ConceptExtractionStatus {
  PENDING = "pending",
  EXTRACTED = "extracted",
  IN_REVIEW = "in-review",
  REVIEWED = "reviewed",
}

/**
 * OpenAI API prompt length limits
 */
export const OPENAI_LIMITS = {
  DALLE_2_PROMPT_MAX_LENGTH: 1000,
  DALLE_3_PROMPT_MAX_LENGTH: 4000,
  GPT_CONTEXT_MAX_TOKENS: 128000, // for gpt-4o-mini
} as const;

/* eslint-enable no-unused-vars */
