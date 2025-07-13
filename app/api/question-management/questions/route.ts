import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@/lib/dbConnect";
import QuestionBank from "@/datamodels/questionBank.model";
import QuestionDraft from "@/datamodels/questionDraft.model";
import { createApiResponse, createErrorResponse } from "@/lib/utils/apiResponse";
import { QuestionType, QuestionLevel } from "@/lib/enum";

interface CreateQuestionRequest {
  question: string;
  correctAnswer: string;
  questionType: QuestionType;
  targetConcepts: string[];
  difficulty: QuestionLevel;
  options?: string[];
  audioUrl?: string;
  imageUrl?: string;
  source: "manual" | "generated";
  isDraft?: boolean; // If true, save as draft; if false, save directly to question bank
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body: CreateQuestionRequest = await request.json();
    const {
      question,
      correctAnswer,
      questionType,
      targetConcepts,
      difficulty,
      options,
      audioUrl,
      imageUrl,
      source,
      isDraft = false,
    } = body;

    // Validation
    if (!question?.trim()) {
      return createErrorResponse("Question text is required", 400);
    }

    if (!correctAnswer?.trim()) {
      return createErrorResponse("Correct answer is required", 400);
    }

    if (!targetConcepts || targetConcepts.length === 0) {
      return createErrorResponse("At least one target concept is required", 400);
    }

    if (!Object.values(QuestionType).includes(questionType)) {
      return createErrorResponse("Invalid question type", 400);
    }

    if (!Object.values(QuestionLevel).includes(difficulty)) {
      return createErrorResponse("Invalid difficulty level", 400);
    }

    // Type-specific validations
    const questionTypesWithOptions = [
      QuestionType.VOCAB_CHOICE,
      QuestionType.MULTI_SELECT,
      QuestionType.WORD_ARRANGEMENT,
    ];

    if (questionTypesWithOptions.includes(questionType)) {
      if (!options || options.length < 2) {
        return createErrorResponse(`${questionType} requires at least 2 options`, 400);
      }
    }

    const questionData = {
      id: uuidv4(),
      question: question.trim(),
      correctAnswer: correctAnswer.trim(),
      questionType,
      targetConcepts,
      difficulty,
      source,
      options: options?.filter(opt => opt.trim() !== "") || [],
      audioUrl: audioUrl?.trim() || undefined,
      imageUrl: imageUrl?.trim() || undefined,
    };

    let savedQuestion;

    if (isDraft) {
      // Save as draft
      const draftData = {
        ...questionData,
        status: "draft" as const,
        generationBatch: uuidv4(), // Single question batch
        generationAttempt: 1,
      };

      savedQuestion = await QuestionDraft.create(draftData);
    } else {
      // Save directly to question bank
      const bankData = {
        ...questionData,
        timesUsed: 0,
        successRate: 0,
        lastUsed: null,
        isActive: true,
      };

      savedQuestion = await QuestionBank.create(bankData);
    }

    return createApiResponse({
      message: `Question ${isDraft ? 'saved as draft' : 'created'} successfully`,
      question: savedQuestion,
    });

  } catch (error) {
    console.error("Error creating question:", error);
    return createErrorResponse("Failed to create question", 500);
  }
}