import { PracticeMode, QuestionLevel } from "@/lib/enum";
import { IConcept } from "@/datamodels/concept.model";
import { IConceptProgress } from "@/datamodels/conceptProgress.model";
import { IQuestionBank } from "@/datamodels/questionBank.model";

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
  relatedConcepts: IConcept[];
  userLevel: QuestionLevel;
  previousQuestions: string[];
  sessionQuestionCount: number;
}

/**
 * Smart context for LLM operations
 */
export interface SmartContext {
  conceptSummaries: ConceptSummary[];
  relationshipHints: string[];
  userWeaknesses: string[];
  sessionObjectives: string[];
}

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
 * Practice session state
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
}

/**
 * Individual question response
 */
export interface QuestionResponse {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  responseTime: number;
  attempts: number;
  conceptsTargeted: string[];
  feedback: string;
  timestamp: Date;
}

/**
 * Session metrics for tracking progress
 */
export interface SessionMetrics {
  accuracy: number;
  averageResponseTime: number;
  conceptsReviewed: number;
  strongConcepts: string[];
  weakConcepts: string[];
  recommendedReview: string[];
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