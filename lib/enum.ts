// lib/enum.ts (Updated with PracticeMode)
/**
 * Comprehensive enum definitions for the Polish learning application
 * Includes both existing and new concept-based learning enums
 */

/* eslint-disable no-unused-vars */
export enum QuestionType {
  CLOZE_GAP = "cloze_gap",
  MULTIPLE_CHOICE = "multiple_choice",
  MAKE_SENTENCE = "make_sentence",
  Q_AND_A = "q_and_a",
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
 * Normal: Smart concept selection based on SRS
 * Previous: Review previously asked questions
 * Drill: Focus on previously failed questions
 */
export enum PracticeMode {
  NORMAL = "normal",
  PREVIOUS = "previous",
  DRILL = "drill",
}

/**
 * Concept extraction workflow status
 * Pending: Course added but concepts not extracted
 * Completed: LLM extraction finished, awaiting human review
 * Reviewed: Human review completed, concepts added to DB
 */
export enum ConceptExtractionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  REVIEWED = "reviewed",
}
/* eslint-enable no-unused-vars */
