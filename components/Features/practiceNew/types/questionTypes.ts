import { QuestionType, QuestionLevel } from "@/lib/enum";

export interface ValidationResult {
  isCorrect: boolean;
  feedback: string;
  correctAnswer: string;
  attempts: number;
  responseTime: number;
  previousAnswer?: string | string[]; // Store user's previous answer for retry
  showFinalAnswer?: boolean; // Show final answer after 3 attempts
}

export interface QuestionData {
  id: string;
  question: string;
  questionType: QuestionType;
  difficulty: QuestionLevel;
  targetConcepts: string[];
  correctAnswer?: string;
  options?: string[];
  audioUrl?: string;
  imageUrl?: string;
}

export interface QuestionComponentProps {
  question: QuestionData;
  userAnswer: string | string[];
  onAnswerChange: (answer: string | string[]) => void;
  validationResult?: ValidationResult | null;
  isValidating: boolean;
  disabled: boolean;
  onSubmit: () => void;
  onRetry: () => void;
  onNext: () => void;
  showSubmit: boolean;
  showRetry: boolean;
  showNext: boolean;
}

export interface BaseQuestionProps {
  question: QuestionData;
  userAnswer: string | string[];
  onAnswerChange: (answer: string | string[]) => void;
  disabled: boolean;
}

export interface DragDropItem {
  id: string;
  content: string;
  originalIndex: number;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export interface ProgressiveHint {
  id: string;
  text: string;
  revealedAt: number;
  cost: number;
}