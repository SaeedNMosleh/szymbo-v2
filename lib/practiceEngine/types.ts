import { PracticeMode, QuestionLevel } from "@/lib/enum";
import { IConcept } from "@/datamodels/concept.model";

/**
 * Lightweight concept summary for context building
 */
export interface ConceptSummary {
  id: string;
  name: string;
  category: string;
  keyExamples: string[];
  difficultyLevel: QuestionLevel;
}

/**
 * Individual question response (updated for 3-attempt workflow)
 */
export interface QuestionResponse {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  responseTime: number; // Total time across all attempts
  attempts: number; // Number of attempts (1-3)
  conceptsTargeted: string[];
  feedback: string;
  timestamp: Date;
  showCorrectAnswer?: boolean; // Whether to show correct answer (after 3rd attempt)
}

/**
 * Practice session configuration
 */
export interface PracticeSessionConfig {
  mode: PracticeMode;
  userId: string;
  maxQuestions?: number;
  maxDuration?: number; // in minutes
  targetConcepts?: string[]; // for manual selection
  difficultyRange?: QuestionLevel[];
}

/**
 * Concept selection criteria for practice sessions
 */
export interface ConceptSelectionCriteria {
  userId: string;
  maxConcepts: number;
  includeOverdue: boolean;
  includeDueToday: boolean;
  difficultyBalance: "mixed" | "focused" | "progressive";
  categoryBalance: "mixed" | "grammar_focus" | "vocabulary_focus";
}

/**
 * Context for question generation
 */
export interface QuestionGenerationContext {
  targetConcepts: IConcept[];
  contextConcepts: IConcept[]; // Group-based and category-based context concepts
  userLevel: QuestionLevel;
  previousQuestions: string[];
  sessionQuestionCount: number;
  groupContext?: {
    groupId: string;
    groupName: string;
    groupType: string;
  };
}

/**
 * Smart context for LLM operations
 */
export interface SmartContext {
  conceptSummaries: ConceptSummary[];
  groupHints: string[]; // Group-based organization hints
  userWeaknesses: string[];
  sessionObjectives: string[];
}

/**
 * SRS calculation parameters
 */
export interface SRSParameters {
  easinessFactor: number;
  intervalDays: number;
  consecutiveCorrect: number;
  isCorrect: boolean;
  responseTime: number;
  difficultyRating?: number; // user-provided difficulty (1-5)
}

/**
 * SRS calculation result
 */
export interface SRSResult {
  nextReview: Date;
  newEasinessFactor: number;
  newIntervalDays: number;
  masteryLevelChange: number;
}

/**
 * Practice session state (updated for 3-attempt workflow)
 */
export interface PracticeSessionState {
  sessionId: string;
  mode: PracticeMode;
  selectedConcepts: string[];
  currentQuestionIndex: number;
  totalQuestions: number;
  responses: QuestionResponse[];
  startTime: Date;
  isCompleted: boolean;
  completionReason?: 'completed' | 'abandoned';
  currentAttempt?: number; // Current attempt for the active question (1-3)
  questionsCompleted?: number; // Questions that have been completed (correct or 3 attempts)
}

/**
 * Session metrics for tracking progress (updated for 3-attempt workflow)
 */
export interface SessionMetrics {
  accuracy: number;
  averageResponseTime: number;
  conceptsReviewed: number;
  strongConcepts: string[];
  weakConcepts: string[];
  recommendedReview: string[];
  attemptsBreakdown: {
    firstAttempt: number;
    secondAttempt: number;
    thirdAttempt: number;
    failed: number;
  };
  questionsCompleted: number;
  questionsAttempted: number;
  completionReason: 'completed' | 'abandoned';
}

/**
 * Question selection strategy
 */
export interface QuestionSelectionStrategy {
  bankQuestionRatio: number; // 0-1, how much to prefer existing questions
  difficultyProgression: "linear" | "adaptive" | "mixed";
  conceptMixing: "interleaved" | "blocked" | "random";
  repetitionSpacing: number; // minimum questions between same concept
}

/**
 * Practice engine configuration
 */
export interface PracticeEngineConfig {
  defaultSessionLength: number;
  maxConceptsPerSession: number;
  minConceptsPerSession: number;
  questionSelectionStrategy: QuestionSelectionStrategy;
  srsParameters: {
    initialInterval: number;
    maxInterval: number;
    minEasinessFactor: number;
    maxEasinessFactor: number;
  };
}

/**
 * Concept priority calculation result
 */
export interface ConceptPriority {
  conceptId: string;
  priority: number; // 0-1 scale
  reason: "overdue" | "due_today" | "reinforcement" | "weakness" | "new";
  daysSinceLastReview: number;
  urgencyScore: number;
}

/**
 * Practice session analysis
 */
export interface SessionAnalysis {
  performanceByCategory: Record<string, number>;
  timeDistribution: Record<string, number>;
  difficultyAccuracy: Record<QuestionLevel, number>;
  conceptMastery: Record<string, number>;
  recommendations: string[];
}

/**
 * Custom error types for practice engine
 */
export class PracticeEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PracticeEngineError";
  }
}

export class ConceptSelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConceptSelectionError";
  }
}

export class SRSCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SRSCalculationError";
  }
}
