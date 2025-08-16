import { QuestionData } from "@/components/Features/practiceNew/types/questionTypes";
import { QuestionType, QuestionLevel } from "@/lib/enum";

interface QuestionDraft {
  id: string;
  question: string;
  correctAnswer: string;
  questionType: QuestionType;
  targetConcepts: string[];
  difficulty: QuestionLevel;
  options?: string[];
  audioUrl?: string;
  imageUrl?: string;
  source: "generated" | "manual";
  createdDate: string;
  status?: "draft" | "approved" | "rejected";
  reviewNotes?: string;
}

interface QuestionBankItem {
  id: string;
  question: string;
  correctAnswer: string;
  questionType: QuestionType;
  targetConcepts: string[];
  conceptNames: string[];
  difficulty: QuestionLevel;
  timesUsed: number;
  successRate: number;
  lastUsed: Date | null;
  createdDate: Date;
  isActive: boolean;
  source: "manual" | "generated" | "momentary";
  options?: string[];
  audioUrl?: string;
  imageUrl?: string;
}

export function transformDraftToQuestionData(draft: QuestionDraft): QuestionData {
  return {
    id: draft.id,
    question: draft.question,
    questionType: draft.questionType,
    difficulty: draft.difficulty,
    targetConcepts: draft.targetConcepts,
    correctAnswer: draft.correctAnswer,
    options: draft.options,
    audioUrl: draft.audioUrl,
    imageUrl: draft.imageUrl,
  };
}

export function transformBankItemToQuestionData(bankItem: QuestionBankItem): QuestionData {
  return {
    id: bankItem.id,
    question: bankItem.question,
    questionType: bankItem.questionType,
    difficulty: bankItem.difficulty,
    targetConcepts: bankItem.targetConcepts,
    correctAnswer: bankItem.correctAnswer,
    options: bankItem.options,
    audioUrl: bankItem.audioUrl,
    imageUrl: bankItem.imageUrl,
  };
}